import { useState, useEffect } from "react";
import { connectToDB } from "@/lib/mongoose";
import { Product } from "@/models/Products";
import { Category } from "@/models/Category";
import Loader from "@/components/Loader";
import ProductsList from "@/components/ProductsList";
import { motion, AnimatePresence } from "framer-motion";
import { FaFilter, FaChevronDown, FaChevronUp, FaChevronRight } from "react-icons/fa";

export default function Products({ allProducts, categories }) {
  const [loading, setLoading] = useState(true);
  const [displayedProducts, setDisplayedProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [openSections, setOpenSections] = useState({});
  const [availableProperties, setAvailableProperties] = useState({});
  const [selectedMainCategory, setSelectedMainCategory] = useState(null);

  const [currentFilters, setCurrentFilters] = useState({
    minPrice: '',
    maxPrice: '',
    sortOrder: '',
    properties: {},
    category: '',
  });

  const productsPerPage = 8;

  useEffect(() => {
    if (allProducts && allProducts.length > 0) {
      const properties = {};
      allProducts.forEach(product => {
        if (product.properties) {
          Object.entries(product.properties).forEach(([key, value]) => {
            if (!properties[key]) {
              properties[key] = new Set();
            }
            if (Array.isArray(value)) {
              value.forEach(v => properties[key].add(v));
            } else {
              properties[key].add(value);
            }
          });
        }
      });

      Object.keys(properties).forEach(key => {
        properties[key] = Array.from(properties[key]);
      });

      setAvailableProperties(properties);
      applyFilters(allProducts);
    }

    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, [allProducts]);

  useEffect(() => {
    applyFilters(allProducts);
  }, [currentFilters, selectedMainCategory]);

  const applyFilters = (products) => {
    if (!products) return;
    
    let filtered = [...products].filter(product => {
      // Get the minimum price from variants
      const minPrice = Math.min(...product.variants.map(v => v.price));
      
      if (currentFilters.minPrice !== '' && minPrice < Number(currentFilters.minPrice)) return false;
      if (currentFilters.maxPrice !== '' && minPrice > Number(currentFilters.maxPrice)) return false;
  
      if (selectedMainCategory) {
        const subCategories = categories
          .filter(cat => cat.parent === selectedMainCategory)
          .map(cat => cat._id);
        
        if (currentFilters.category) {
          return product.category === currentFilters.category;
        } else {
          return product.category === selectedMainCategory || subCategories.includes(product.category);
        }
      }
  
      for (const [key, values] of Object.entries(currentFilters.properties)) {
        if (values.length > 0) {
          if (!product.properties || !product.properties[key] ||
            (Array.isArray(product.properties[key])
              ? !product.properties[key].some(v => values.includes(v))
              : !values.includes(product.properties[key]))) {
            return false;
          }
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
    setDisplayedProducts(filtered.slice(0, productsPerPage));
    setHasMore(filtered.length > productsPerPage);
    setPage(1);
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

  const loadMoreProducts = () => {
    setLoadingMore(true);
    const startIndex = displayedProducts.length;
    const endIndex = startIndex + productsPerPage;
    const newProducts = filteredProducts.slice(startIndex, endIndex);

    setDisplayedProducts(prevProducts => [...prevProducts, ...newProducts]);
    setPage(prevPage => prevPage + 1);
    setHasMore(endIndex < filteredProducts.length);
    setLoadingMore(false);
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
      <h1 className="text-3xl text-center bg-slate-300 p-5">جميع المنتجات</h1>
      <div className="container mx-auto px-2 py-4">
        <button
          onClick={() => setShowFilters(!showFilters)}
          className="bg-blue-900 text-white px-4 py-2 rounded-lg hover:bg-blue-800 transition flex items-center mb-4 mr-4"
        >
          <FaFilter className="ml-2" />
          {showFilters ? 'إخفاء الفلاتر' : 'عرض الفلاتر'}
        </button>

        <div className="flex flex-col md:flex-row gap-2">
          {showFilters && (
            <div className="md:w-1/4">
              <div className="bg-gray-300 p-6 rounded-lg shadow-lg mb-4">
                <h3 className="text-2xl font-semibold mb-4">الفلاتر</h3>

                <FilterSection
                  title="الفئات"
                  name="categories"
                  isOpen={openSections['categories']}
                  toggleSection={toggleSection}
                >
                  <div className="space-y-2">
                    <RadioButton
                      label="جميع الفئات"
                      name="category"
                      value=""
                      checked={currentFilters.category === '' && !selectedMainCategory}
                      onChange={() => {
                        setSelectedMainCategory(null);
                        handleFilterChange('category', '');
                      }}
                    />

                    {categories.filter(cat => !cat.parent).map(mainCategory => (
                      <div key={mainCategory._id} className="ml-4">
                        <div
                          className="flex items-center cursor-pointer hover:text-blue-600"
                          onClick={() => setSelectedMainCategory(
                            selectedMainCategory === mainCategory._id ? null : mainCategory._id
                          )}
                        >
                          {selectedMainCategory === mainCategory._id ?
                            <FaChevronDown className="mr-2" /> :
                            <FaChevronRight className="mr-2" />
                          }
                          <span>{mainCategory.name}</span>
                        </div>

                        {selectedMainCategory === mainCategory._id && (
                          <div className="ml-6 mt-2 space-y-2">
                            {categories
                              .filter(subCat => subCat.parent === mainCategory._id)
                              .map(subCategory => (
                                <RadioButton
                                  key={subCategory._id}
                                  label={subCategory.name}
                                  name="category"
                                  value={subCategory._id}
                                  checked={currentFilters.category === subCategory._id}
                                  onChange={(e) => handleFilterChange('category', e.target.value)}
                                />
                              ))
                            }
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </FilterSection>

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
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                    <input
                      type="number"
                      placeholder="السعر الأعلى"
                      value={currentFilters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                    <div className="space-y-2 ">
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
              </div>
            </div>
          )}

          <div className={`${showFilters ? 'md:w-3/4' : 'w-full'}`}>
            {displayedProducts.length > 0 ? (
              <>
                <ProductsList products={displayedProducts} />
                {loadingMore && (
                  <div className="flex justify-center mt-4">
                    <Loader />
                  </div>
                )}
                {!loadingMore && hasMore && (
                  <div className="flex justify-center mt-4">
                    <button
                      onClick={loadMoreProducts}
                      className="mt-4 bg-black text-white px-4 py-2 rounded-lg"
                    >
                      تحميل المزيد
                    </button>
                  </div>
                )}
              </>
            ) : (
              <p className="text-center mt-4 text-gray-600">
                لا توجد منتجات متطابقة مع الفلاتر المحددة.
              </p>
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
  <label className="flex items-center gap-1 space-x-2">
    <input
      type="checkbox"
      checked={checked}
      onChange={onChange}
      className="form-checkbox text-blue-600 "
    />
    <span className="text-base">{label}</span>
    </label>
);

export async function getServerSideProps() {
  try {
    await connectToDB();
    const [allProducts, categories] = await Promise.all([
      Product.find({}).sort({ '_id': -1 }).lean(),
      Category.find({}).lean()
    ]);

    const categoriesWithRelations = categories.map(cat => ({
      ...cat,
      parent: cat.parent ? cat.parent.toString() : null
    }));

    return {
      props: {
        allProducts: JSON.parse(JSON.stringify(allProducts)),
        categories: JSON.parse(JSON.stringify(categoriesWithRelations))
      }
    };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return {
      props: {
        allProducts: [],
        categories: [],
        error: error.message
      }
    };
  }
}
