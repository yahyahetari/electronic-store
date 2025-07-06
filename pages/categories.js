import { useState, useEffect } from "react";
import { connectToDB } from "@/lib/mongoose";
import { Category } from "@/models/Category";
import { Product } from "@/models/Products";
import Loader from "@/components/Loader";
import { motion, AnimatePresence } from "framer-motion";
import { FaFilter, FaChevronDown, FaChevronUp } from "react-icons/fa";
import ProductsList from "@/components/ProductsList";

export default function Categories({ categoriesWithSubcategories = [] }) {
  const [loading, setLoading] = useState(true);
  const [selectedSubcategory, setSelectedSubcategory] = useState(null);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);
  const [currentFilters, setCurrentFilters] = useState({
    minPrice: '',
    maxPrice: '',
    sortOrder: '',
    properties: {},
  });
  const [openSections, setOpenSections] = useState({});
  const [allProperties, setAllProperties] = useState({});

  useEffect(() => {
    setTimeout(() => {
      setLoading(false);
    }, 700);
  }, []);

  useEffect(() => {
    if (selectedSubcategory) {
      const products = categoriesWithSubcategories
        .flatMap(cat => cat.subcategories)
        .find(sub => sub._id === selectedSubcategory)?.products || [];

      const properties = {};
      products.forEach(product => {
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

      setAllProperties(properties);
      applyFilters(products);
    }
  }, [selectedSubcategory, currentFilters, categoriesWithSubcategories]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-gray-100">
        <Loader />
      </div>
    );
  }

  const handleSubcategoryClick = (subcategoryId) => {
    setSelectedSubcategory(subcategoryId);
    setShowFilters(false);
    setCurrentFilters({
      minPrice: '',
      maxPrice: '',
      sortOrder: '',
      properties: {},
    });
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


  const applyFilters = (products) => {
    let filtered = products.filter(product => {
      if (currentFilters.minPrice !== '' && product.price < Number(currentFilters.minPrice)) return false;
      if (currentFilters.maxPrice !== '' && product.price > Number(currentFilters.maxPrice)) return false;

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
      filtered.sort((a, b) => a.price - b.price);
    } else if (currentFilters.sortOrder === 'desc') {
      filtered.sort((a, b) => b.price - a.price);
    }

    setFilteredProducts(filtered);
  };

  const toggleSection = (sectionName) => {
    setOpenSections(prev => ({
      ...prev,
      [sectionName]: !prev[sectionName]
    }));
  };

  const mainCategoriesWithSubcategories = categoriesWithSubcategories.filter(
    category => category.subcategories && category.subcategories.length > 0
  );

  return (
    <div className="min-h-screen bg-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <AnimatePresence>
          {!selectedSubcategory && (
            <motion.h1
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="text-4xl font-bold text-center mb-8 text-gray-800"
            >
              فئات المنتجات
            </motion.h1>
          )}
        </AnimatePresence>

        {/* عرض الفئات الرئيسية والفرعية */}
        {!selectedSubcategory && mainCategoriesWithSubcategories.length > 0 ? (
          mainCategoriesWithSubcategories.map((category) => (
            <AnimatePresence key={category._id}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.5 }}
                className="mb-12 bg-white rounded-lg shadow-lg overflow-hidden"
              >
                <div className="p-6">
                  <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">{category.name}</h2>

                  <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9 xl:grid-cols-10 gap-6">
                    {category.subcategories.map((subcategory) => (
                      <div key={subcategory._id} className="flex flex-col items-center">
                        <div
                          className="w-full cursor-pointer"
                          onClick={() => handleSubcategoryClick(subcategory._id)}
                        >
                          {subcategory.image ? (
                            <div className="bg-white shadow-sm rounded-full border-2 overflow-hidden mx-auto h-16 w-16 xl:h-28 xl:w-28 lg:h-24 lg:w-24 md:h-20 md:w-20 sm:h-20 sm:w-20 border-gray-600">
                              <img
                                src={subcategory.image}
                                alt={subcategory.name}
                                className="h-full w-full object-cover object-top"
                              />
                            </div>
                          ) : (
                            <div className="w-24 h-24 bg-gray-200 rounded-full flex items-center justify-center mx-auto">
                              بدون صورة
                            </div>
                          )}
                        </div>
                        <motion.h3
                          initial={{ opacity: 0, y: -20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -20 }}
                          className="text-lg font-semibold mt-4 text-center cursor-pointer"
                          onClick={() => handleSubcategoryClick(subcategory._id)}
                        >
                          {subcategory.name}
                        </motion.h3>
                      </div>
                    ))}
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          ))
        ) : selectedSubcategory ? (
          <div >
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
                      title="ترتيب السعر"
                      name="sortOrder"
                      isOpen={openSections['sortOrder']}
                      toggleSection={toggleSection}
                    >
                      <div className="space-y-2">
                        <RadioButton
                          label=" من الارخص إلى الأغلى"
                          name="sortOrder"
                          value="asc"
                          checked={currentFilters.sortOrder === 'asc'}
                          onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                        />
                        <RadioButton
                          label=" من الأغلى إلى الارخص"
                          name="sortOrder"
                          value="desc"
                          checked={currentFilters.sortOrder === 'desc'}
                          onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
                        />
                      </div>
                    </FilterSection>

                    {Object.entries(allProperties).map(([propertyName, values]) => (
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

            <button
              onClick={() => {
                setSelectedSubcategory(null);
                setShowFilters(false);
                setCurrentFilters({
                  minPrice: '',
                  maxPrice: '',
                  sortOrder: '',
                  properties: {},
                });
              }}
              className="mt-8 w-full py-3 bg-gradient-to-r from-purple-600 to-blue-500 text-white rounded-full font-semibold transform transition-all duration-300 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              العودة إلى الفئات
            </button>
          </div>
        ) : (
          <p className="text-center text-gray-600">لم يتم العثور على فئات.</p>
        )}
      </div>
    </div>
  );
}

const FilterSection = ({ title, name, isOpen, toggleSection, children }) => (
  <div className="mb-4 border-b border-gray-200 pb-4">
    <div
      className="flex justify-between items-center cursor-pointer"
      onClick={() => toggleSection(name)}
    >
      <h4 className="text-lg font-medium text-gray-700">{title}</h4>
      {isOpen ? <FaChevronUp /> : <FaChevronDown />}
    </div>
    {isOpen && <div className="mt-3">{children}</div>}
  </div>
);

const RadioButton = ({ label, name, value, checked, onChange }) => (
  <label className="flex items-center gap-4 cursor-pointer mb-2">
    <input
      type="radio"
      className="form-radio text-blue-600 w-5 h-5"
      name={name}
      value={value}
      checked={checked}
      onClick={(e) => {
        if (checked) {
          e.preventDefault();
          onChange({ target: { name, value: '' } });
        }
      }}
      onChange={onChange}
    />
    <span className="text-gray-700 text-lg">{label}</span>
  </label>
);



const Checkbox = ({ label, checked, onChange }) => (
  <label className="flex items-center gap-2 space-x-3 cursor-pointer">
    <input
      type="checkbox"
      className="form-checkbox text-blue-600"
      checked={checked}
      onChange={onChange}
    />
    <span className="text-gray-700">{label}</span>
  </label>
);

export async function getServerSideProps() {
  try {
    await connectToDB();

    const mainCategories = await Category.find({ parent: null }).lean();

    const categoriesWithSubcategories = await Promise.all(
      mainCategories.map(async (category) => {
        const subcategories = await Category.find({ parent: category._id }).lean();
        const products = await Product.find({
          category: { $in: [category._id, ...subcategories.map(sub => sub._id)] }
        }).lean();

        return {
          ...category,
          subcategories: subcategories.map(sub => ({
            ...sub,
            products: products.filter(p => p.category.toString() === sub._id.toString())
          })),
        };
      })
    );

    return {
      props: {
        categoriesWithSubcategories: JSON.parse(JSON.stringify(categoriesWithSubcategories)),
      },
    };
  } catch (error) {
    console.error("خطأ في جلب الفئات:", error);
    return {
      props: {
        categoriesWithSubcategories: [],
      },
    };
  }
}