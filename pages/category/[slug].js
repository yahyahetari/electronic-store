import { useState, useEffect, useCallback } from "react";
import ProductsList from "@/components/ProductsList";
import { connectToDB } from "@/lib/mongoose";
import { Product } from "@/models/Products";
import { Category } from "@/models/Category";
import Loader from "@/components/Loader";
import { FaFilter, FaSearch, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { motion, AnimatePresence } from 'framer-motion';

export async function getServerSideProps({ params }) {
  await connectToDB();
  const { query } = params;
  const searchRegex = new RegExp(query, 'i');

  const searchedProducts = await Product.find({
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { tags: searchRegex },
    ]
  });

  const searchedCategories = await Category.find({ 
    $or: [
      { name: searchRegex },
      { tags: searchRegex }
    ]
  });

  const productsInCategories = await Product.find({
    category: { $in: searchedCategories.map(cat => cat._id) }
  });

  const allProducts = [...searchedProducts, ...productsInCategories];
  const uniqueProducts = Array.from(new Set(allProducts.map(p => p._id.toString())))
    .map(_id => allProducts.find(p => p._id.toString() === _id));

  const productCategoryIds = new Set(uniqueProducts.map(product => product.category.toString()));

  const relevantCategories = await Category.find({
    _id: { $in: Array.from(productCategoryIds) }
  });

  return {
    props: {
      searchedProducts: JSON.parse(JSON.stringify(uniqueProducts)),
      categories: JSON.parse(JSON.stringify(relevantCategories)),
      query,
    },
  };
}

export default function SearchPage({ searchedProducts, query, categories }) {
  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentFilters, setCurrentFilters] = useState({
    minPrice: '',
    maxPrice: '',
    sortOrder: '',
    properties: {},
    categories: []
  });
  const [showFilters, setShowFilters] = useState(false);
  const [openSections, setOpenSections] = useState({});
  const [availableProperties, setAvailableProperties] = useState({});

  // دالة لتحديث الخصائص المتاحة مع ترتيب ذكي
  const updateAvailableProperties = useCallback((products) => {
    const properties = {};
    
    products.forEach(product => {
      if (product.variants && product.variants.length > 0) {
        product.variants.forEach(variant => {
          if (variant.properties) {
            Object.entries(variant.properties).forEach(([key, values]) => {
              if (!properties[key]) {
                properties[key] = new Set();
              }
              (Array.isArray(values) ? values : [values]).forEach(value => {
                properties[key].add(value);
              });
            });
          }
        });
      } else if (product.properties) {
        Object.entries(product.properties).forEach(([key, values]) => {
          if (!properties[key]) {
            properties[key] = new Set();
          }
          (Array.isArray(values) ? values : [values]).forEach(value => {
            properties[key].add(value);
          });
        });
      }
    });

    // دالة الترتيب الذكي للخصائص
    const smartSort = (values) => {
      return values.sort((a, b) => {
        const aStr = a.toString();
        const bStr = b.toString();
        
        const extractNumbers = (text) => {
          const matches = text.match(/\d+/g);
          return matches ? matches.map(Number) : [0];
        };
        
        const aNumbers = extractNumbers(aStr);
        const bNumbers = extractNumbers(bStr);
        
        if (aNumbers.length > 0 && bNumbers.length > 0) {
          if (aNumbers[0] !== bNumbers[0]) {
            return aNumbers[0] - bNumbers[0];
          }
          if (aNumbers.length > 1 && bNumbers.length > 1) {
            return aNumbers[1] - bNumbers[1];
          }
          return aNumbers.length - bNumbers.length;
        }
        
        return aStr.localeCompare(bStr, 'ar');
      });
    };

    const formattedProperties = {};
    Object.entries(properties).forEach(([key, values]) => {
      const valuesArray = Array.from(values);
      formattedProperties[key] = smartSort(valuesArray);
    });

    setAvailableProperties(formattedProperties);
  }, []);

  // دالة تطبيق الفلاتر المحسنة
  const applyFilters = useCallback((products, filters) => {
    if (!products) return;
    
    let filtered = [...products].filter(product => {
      // فلترة السعر
      let productPrice;
      if (product.variants && product.variants.length > 0) {
        const variantPrices = product.variants.map(v => v.price);
        productPrice = Math.min(...variantPrices);
      } else {
        productPrice = product.price || 0;
      }
      
      if (filters.minPrice !== '' && productPrice < Number(filters.minPrice)) return false;
      if (filters.maxPrice !== '' && productPrice > Number(filters.maxPrice)) return false;

      // فلترة الفئات
      if (filters.categories.length > 0) {
        if (!filters.categories.includes(product.category.toString())) return false;
      }

      // فلترة الخصائص المحسنة
      for (const [key, values] of Object.entries(filters.properties)) {
        if (values.length > 0) {
          let hasMatchingProperty = false;
          
          if (product.variants && product.variants.length > 0) {
            hasMatchingProperty = product.variants.some(variant => {
              if (!variant.properties || !variant.properties[key]) return false;
              
              const variantPropertyValues = Array.isArray(variant.properties[key])
                ? variant.properties[key]
                : [variant.properties[key]];
              
              return values.some(value => variantPropertyValues.includes(value));
            });
          } 
          else if (product.properties && product.properties[key]) {
            const productPropertyValues = Array.isArray(product.properties[key]) 
              ? product.properties[key] 
              : [product.properties[key]];
            hasMatchingProperty = values.some(value => productPropertyValues.includes(value));
          }
          
          if (!hasMatchingProperty) return false;
        }
      }
      return true;
    });

    // الترتيب
    if (filters.sortOrder === 'asc') {
      filtered.sort((a, b) => {
        const priceA = a.variants && a.variants.length > 0 
          ? Math.min(...a.variants.map(v => v.price)) 
          : a.price || 0;
        const priceB = b.variants && b.variants.length > 0 
          ? Math.min(...b.variants.map(v => v.price)) 
          : b.price || 0;
        return priceA - priceB;
      });
    } else if (filters.sortOrder === 'desc') {
      filtered.sort((a, b) => {
        const priceA = a.variants && a.variants.length > 0 
          ? Math.min(...a.variants.map(v => v.price)) 
          : a.price || 0;
        const priceB = b.variants && b.variants.length > 0 
          ? Math.min(...b.variants.map(v => v.price)) 
          : b.price || 0;
        return priceB - priceA;
      });
    }

    setFilteredProducts(filtered);
  }, []);

  // تحميل أولي
  useEffect(() => {
    if (searchedProducts && searchedProducts.length > 0) {
      updateAvailableProperties(searchedProducts);
      applyFilters(searchedProducts, currentFilters);
    } else {
      setFilteredProducts([]);
    }
    setLoading(false);
  }, [searchedProducts, updateAvailableProperties, applyFilters, currentFilters]);

  // تطبيق الفلاتر عند تغييرها
  useEffect(() => {
    applyFilters(searchedProducts, currentFilters);
  }, [currentFilters, searchedProducts, applyFilters]);

  const handleFilterChange = (name, value) => {
    setCurrentFilters(prev => {
      if (name === 'categories') {
        const updatedCategories = prev.categories.includes(value)
          ? prev.categories.filter(v => v !== value)
          : [...prev.categories, value];
        return { ...prev, categories: updatedCategories };
      }
      
      if (name.startsWith('property_')) {
        const propertyName = name.replace('property_', '');
        const updatedProperties = { ...prev.properties };
        if (!updatedProperties[propertyName]) {
          updatedProperties[propertyName] = [value];
        } else if (updatedProperties[propertyName].includes(value)) {
          updatedProperties[propertyName] = updatedProperties[propertyName].filter(v => v !== value);
          if (updatedProperties[propertyName].length === 0) {
            delete updatedProperties[propertyName];
          }
        } else {
          updatedProperties[propertyName] = [...updatedProperties[propertyName], value];
        }
        return { ...prev, properties: updatedProperties };
      }
      return { ...prev, [name]: value };
    });
  };

  const toggleSection = (sectionName) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="container mx-auto px-4 py-8" dir="rtl">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between mb-6"
        >
          <h1 className="text-3xl font-bold text-gray-800">
            نتائج البحث عن "{query}"
          </h1>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition"
          >
            <FaFilter className="ml-2" />
            {showFilters ? 'إخفاء الفلاتر' : 'عرض الفلاتر'}
          </motion.button>
        </motion.div>

        <div className="flex flex-col md:flex-row gap-2">
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, x: -50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
                className="md:w-1/4"
              >
                <div className="bg-gray-300 p-6 rounded-lg shadow-lg mb-4">
                  <h3 className="text-2xl font-semibold mb-4">الفلاتر</h3>

                  {/* فلتر الفئات */}
                  {categories.length > 0 && (
                    <FilterSection
                      title="الفئات"
                      name="categories"
                      isOpen={openSections['categories']}
                      toggleSection={toggleSection}
                    >
                      <div className="space-y-2">
                        {categories.map(cat => (
                          <Checkbox
                            key={cat._id}
                            label={cat.name}
                            checked={currentFilters.categories.includes(cat._id)}
                            onChange={() => handleFilterChange('categories', cat._id)}
                          />
                        ))}
                      </div>
                    </FilterSection>
                  )}

                  {/* فلتر السعر */}
                  <FilterSection
                    title="نطاق السعر"
                    name="price"
                    isOpen={openSections['price']}
                    toggleSection={toggleSection}
                  >
                    <div className="flex flex-col space-y-2">
                      <input
                        type="number"
                        placeholder="السعر الأدنى"
                        value={currentFilters.minPrice}
                        onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                      <input
                        type="number"
                        placeholder="السعر الأعلى"
                        value={currentFilters.maxPrice}
                        onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </FilterSection>

                  {/* فلتر الترتيب */}
                  <FilterSection
                    title="ترتيب حسب"
                    name="sortOrder"
                    isOpen={openSections['sortOrder']}
                    toggleSection={toggleSection}
                  >
                    <div className="space-y-2">
                      <RadioButton
                        label="الأرخص"
                        name="sortOrder"
                        value="asc"
                        checked={currentFilters.sortOrder === 'asc'}
                        onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                      />
                      <RadioButton
                        label="الأغلى"
                        name="sortOrder"
                        value="desc"
                        checked={currentFilters.sortOrder === 'desc'}
                        onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                      />
                    </div>
                  </FilterSection>

                  {/* فلاتر الخصائص */}
                  {Object.entries(availableProperties).map(([propertyName, values]) => (
                    <FilterSection
                      key={propertyName}
                      title={propertyName}
                      name={propertyName}
                      isOpen={openSections[propertyName]}
                      toggleSection={toggleSection}
                    >
                      <div className="space-y-2">
                        {values.map(value => (
                          <Checkbox
                            key={value}
                            label={value}
                            checked={currentFilters.properties[propertyName]?.includes(value)}
                            onChange={() => handleFilterChange(`property_${propertyName}`, value)}
                          />
                        ))}
                      </div>
                    </FilterSection>
                  ))}

                  <button
                    onClick={() => setShowFilters(false)}
                    className="mt-4 w-full bg-black text-white px-4 py-2 rounded-lg hover:bg-slate-700 transition"
                  >
                    إخفاء الفلاتر
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className={`${showFilters ? 'md:w-3/4' : 'w-full'}`}>
            {filteredProducts.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center py-8"
              >
                <FaSearch className="mx-auto text-6xl text-gray-400 mb-4" />
                <h2 className="text-2xl font-semibold text-gray-800">لا توجد نتائج</h2>
                <p className="text-gray-600 mt-2">حاول تعديل معايير البحث أو الفلاتر</p>
              </motion.div>
            ) : (
              <ProductsList products={filteredProducts} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

const FilterSection = ({ title, name, isOpen, toggleSection, children }) => (
  <div className="mb-4">
    <button
      onClick={() => toggleSection(name)}
      className="flex justify-between items-center w-full text-right font-semibold mb-2"
    >
      {title}
      {isOpen ? <FaChevronUp /> : <FaChevronDown />}
    </button>
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.3 }}
        >
          {children}
        </motion.div>
      )}
    </AnimatePresence>
  </div>
);

const RadioButton = ({ label, name, value, checked, onChange }) => (
  <label className="flex items-center gap-1 space-x-2 cursor-pointer">
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      onClick={(e) => {
        if (checked) {
          e.preventDefault();
          onChange({ target: { value: '' } });
        }
      }}
      className="form-radio text-blue-600"
    />
    <span className="text-lg">{label}</span>
  </label>
);

const Checkbox = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-1 space-x-2 cursor-pointer">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="form-checkbox text-blue-600"
    />
    <span className="text-base">{label}</span>
  </label>
);