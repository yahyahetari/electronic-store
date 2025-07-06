import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { connectToDB } from "@/lib/mongoose";
import { Category } from "@/models/Category";
import { Product } from "@/models/Products";
import Loader from "@/components/Loader";
import { motion, AnimatePresence } from "framer-motion";
import { FaFilter, FaChevronDown, FaChevronUp } from "react-icons/fa";
import Link from "next/link";
import ProductsList from "@/components/ProductsList";

export default function CategoryPage({ category, subcategories, products }) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState(products);
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({
    minPrice: '',
    maxPrice: '',
    sortOrder: '',
    properties: {},
  });
  const [openSections, setOpenSections] = useState({});
  const [availableProperties, setAvailableProperties] = useState({});

  const updateAvailableProperties = (productsToFilter) => {
    const properties = {};
    
    productsToFilter.forEach(product => {
      product.variants.forEach(variant => {
        Object.entries(variant.properties).forEach(([key, values]) => {
          if (!properties[key]) {
            properties[key] = new Set();
          }
          (Array.isArray(values) ? values : [values]).forEach(value => {
            properties[key].add(value);
          });
        });
      });
    });

    const formattedProperties = {};
    Object.entries(properties).forEach(([key, values]) => {
      formattedProperties[key] = Array.from(values);
    });

    setAvailableProperties(formattedProperties);
  };

  const applyFilters = (productsToFilter) => {
    if (!productsToFilter) return;
    
    let filtered = [...productsToFilter].filter(product => {
      const variantPrices = product.variants.map(v => v.price);
      const minPrice = Math.min(...variantPrices);
      
      if (currentFilters.minPrice !== '' && minPrice < Number(currentFilters.minPrice)) return false;
      if (currentFilters.maxPrice !== '' && minPrice > Number(currentFilters.maxPrice)) return false;

      for (const [key, values] of Object.entries(currentFilters.properties)) {
        if (values.length > 0) {
          const hasMatchingVariant = product.variants.some(variant => {
            return values.every(value => {
              return variant.properties[key]?.includes(value);
            });
          });
          if (!hasMatchingVariant) return false;
        }
      }
      return true;
    });

    if (currentFilters.sortOrder === 'asc') {
      filtered.sort((a, b) => {
        const minPriceA = Math.min(...a.variants.map(v => v.price));
        const minPriceB = Math.min(...b.variants.map(v => v.price));
        return minPriceA - minPriceB;
      });
    } else if (currentFilters.sortOrder === 'desc') {
      filtered.sort((a, b) => {
        const minPriceA = Math.min(...a.variants.map(v => v.price));
        const minPriceB = Math.min(...b.variants.map(v => v.price));
        return minPriceB - minPriceA;
      });
    }

    setFilteredProducts(filtered);
  };

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 700);
  }, []);

  useEffect(() => {
    if (selectedSubcategory) {
      const subcategoryProducts = products.filter(product => 
        product.category.toString() === selectedSubcategory
      );
      updateAvailableProperties(subcategoryProducts);
      applyFilters(subcategoryProducts);
    } else {
      updateAvailableProperties(products);
      applyFilters(products);
    }
  }, [products, currentFilters, selectedSubcategory]);

  const handleSubcategoryClick = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
    const subcategoryProducts = products.filter(product => 
      product.category.toString() === subcategoryId
    );
    setFilteredProducts(subcategoryProducts);
    setCurrentFilters({
      minPrice: '',
      maxPrice: '',
      sortOrder: '',
      properties: {},
    });
    setShowFilters(false);
  };

  const handleFilterChange = (name, value) => {
    setCurrentFilters(prev => {
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
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Loader />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100" dir="rtl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Link href="/" legacyBehavior>
          <button className="mt-8 w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-full font-semibold transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500">
            العودة إلى الرئيسية
          </button>
        </Link>
        <h1 className="text-4xl font-bold text-center my-2 text-gray-800">{category.name}</h1>
        
        <div className="grid grid-cols-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 mb-8">
          {subcategories.map((subcategory) => (
            <div
              key={subcategory._id}
              className={`flex flex-col items-center cursor-pointer ${
                selectedSubcategory === subcategory._id.toString() ? '' : ''
              }`}
              onClick={() => handleSubcategoryClick(subcategory._id.toString())}
            >
              {subcategory.image ? (
                <div className="bg-white shadow-sm rounded-full border overflow-hidden mx-auto h-16 w-16 xl:h-28 xl:w-28 lg:h-24 lg:w-24 md:h-20 md:w-20 sm:h-20 sm:w-20 border-gray-200">
                  <img
                    src={subcategory.image}
                    alt={subcategory.name}
                    className="h-full w-full object-cover object-top"
                  />
                </div>
              ) : (
                <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                  لا توجد صورة
                </div>
              )}
              <h3 className="text-lg font-semibold mt-4 text-center">{subcategory.name}</h3>
            </div>
          ))}
        </div>

        <div className="mt-2">
          <div className="flex justify-between items-center mb-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition flex items-center"
            >
              <FaFilter className="ml-2" />
              {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
            </button>
          </div>

          <div className="flex flex-col md:flex-row gap-6">
            {showFilters && (
              <div className="md:w-1/4">
                <div className="bg-gray-300 p-6 rounded-lg shadow-lg mb-4">
                  <h3 className="text-2xl font-semibold mb-4">الفلاتر</h3>

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
                    className="mt-4 w-full bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition"
                  >
                    إخفاء الفلاتر
                  </button>
                </div>
              </div>
            )}

            <div className={`${showFilters ? 'md:w-3/4' : 'w-full'}`}>
              {filteredProducts.length > 0 ? (
                <ProductsList products={filteredProducts} />
              ) : (
                <p className="text-center text-gray-600">لا توجد منتجات تطابق الفلاتر الحالية.</p>
              )}
            </div>
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
  <label className="flex items-center gap-1 space-x-2">
    <input
      type="radio"
      name={name}
      value={value}
      checked={checked}
      onChange={onChange}
      className="form-radio text-blue-600"
    />
    <span className="text-lg">{label}</span>
  </label>
);

const Checkbox = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-1 space-x-2">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="form-checkbox text-blue-600"
    />
    <span className="text-base">{label}</span>
  </label>
);

export async function getServerSideProps({ params }) {
  try {
    await connectToDB();
    const category = await Category.findOne({ slug: params.slug }).lean();
    if (!category) {
      return { notFound: true };
    }
    const subcategories = await Category.find({ parent: category._id }).lean();
    const subcategoryIds = subcategories.map(sub => sub._id);
    const products = await Product.find({
      category: { $in: [category._id, ...subcategoryIds] }
    }).lean();
    
    return {
      props: {
        category: JSON.parse(JSON.stringify(category)),
        subcategories: JSON.parse(JSON.stringify(subcategories)),
        products: JSON.parse(JSON.stringify(products)),
      },
    };
  } catch (error) {
    console.error("Error fetching category data:", error);
    return {
      props: {
        category: null,
        subcategories: [],
        products: [],
      },
    };
  }
}
