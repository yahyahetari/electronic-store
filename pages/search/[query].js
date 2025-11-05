import { useState, useEffect } from "react";
import ProductsList from "@/components/ProductsList";
import { connectToDB } from "@/lib/mongoose";
import { Product } from "@/models/Products";
import { Category } from "@/models/Category";
import Loader from "@/components/Loader";
import { FaFilter, FaSearch, FaSortAmountDown, FaSortAmountUp, FaChevronDown, FaChevronUp } from "react-icons/fa";
import { motion, AnimatePresence } from 'framer-motion';

export async function getServerSideProps({ params, query: urlQuery }) {
  await connectToDB();
  const { query } = params;
  const searchRegex = new RegExp(query, 'i');

  let filter = { 
    $or: [
      { title: searchRegex },
      { description: searchRegex },
      { tags: searchRegex },
    ]
  };

  if (urlQuery.minPrice || urlQuery.maxPrice) {
    filter['variants.price'] = {};
    if (urlQuery.minPrice) filter['variants.price'].$gte = Number(urlQuery.minPrice);
    if (urlQuery.maxPrice) filter['variants.price'].$lte = Number(urlQuery.maxPrice);
  }

  if (urlQuery.category) {
    filter.category = urlQuery.category;
  }

  const propertyFilters = Object.keys(urlQuery).filter(key => key.startsWith('property_'));
  if (propertyFilters.length > 0) {
    propertyFilters.forEach(key => {
      const propertyName = key.replace('property_', '');
      filter[`variants.properties.${propertyName}`] = urlQuery[key];
    });
  }

  const searchedProducts = await Product.find(filter);
  const searchedCategories = await Category.find({ 
    $or: [
      { name: searchRegex },
      { tags: searchRegex }
    ]
  });

  const productsInCategories = await Product.find({
    category: { $in: searchedCategories.map(cat => cat._id) },
    ...filter
  });

  const allProducts = [...searchedProducts, ...productsInCategories];
  const uniqueProducts = Array.from(new Set(allProducts.map(p => p._id.toString())))
    .map(_id => allProducts.find(p => p._id.toString() === _id));

  // Get unique category IDs from search results
  const productCategoryIds = new Set(uniqueProducts.map(product => product.category.toString()));

  // Fetch only relevant categories
  const relevantCategories = await Category.find({
    _id: { $in: Array.from(productCategoryIds) }
  });

  const allProperties = {};
  uniqueProducts.forEach(product => {
    product.variants.forEach(variant => {
      if (variant.properties) {
        Object.entries(variant.properties).forEach(([key, values]) => {
          if (!allProperties[key]) {
            allProperties[key] = new Set();
          }
          if (Array.isArray(values)) {
            values.forEach(v => allProperties[key].add(v));
          } else {
            allProperties[key].add(values);
          }
        });
      }
    });
  });

  Object.keys(allProperties).forEach(key => {
    allProperties[key] = Array.from(allProperties[key]).sort();
  });

  return {
    props: {
      searchedProducts: JSON.parse(JSON.stringify(uniqueProducts)),
      categories: JSON.parse(JSON.stringify(relevantCategories)),
      properties: JSON.parse(JSON.stringify(allProperties)),
      query,
      filters: {
        minPrice: urlQuery.minPrice || '',
        maxPrice: urlQuery.maxPrice || '',
        category: urlQuery.category || '',
        sortOrder: urlQuery.sortOrder || '',
        ...Object.fromEntries(
          propertyFilters.map(key => [key, urlQuery[key]])
        ),
      },
    },
  };
}

export default function SearchPage({ searchedProducts, query, categories, properties, filters }) {
  const [loading, setLoading] = useState(true);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [currentFilters, setCurrentFilters] = useState(filters);
  const [showFilters, setShowFilters] = useState(false);
  const [sortOrder, setSortOrder] = useState(filters.sortOrder || '');
  const [openSections, setOpenSections] = useState({});

  useEffect(() => {
    setFilteredProducts(searchedProducts);
    setLoading(false);
  }, [searchedProducts]);

  const handleFilterChange = (name, value) => {
    setCurrentFilters(prev => {
      const newFilters = { ...prev };
      if (name === 'minPrice' || name === 'maxPrice') {
        newFilters[name] = value === '' ? '' : Number(value);
      } else if (name === 'category') {
        if (!newFilters[name]) {
          newFilters[name] = [value];
        } else if (newFilters[name].includes(value)) {
          newFilters[name] = newFilters[name].filter(v => v !== value);
          if (newFilters[name].length === 0) delete newFilters[name];
        } else {
          newFilters[name] = [...newFilters[name], value];
        }
      } else {
        if (!newFilters[name]) {
          newFilters[name] = [value];
        } else if (newFilters[name].includes(value)) {
          newFilters[name] = newFilters[name].filter(v => v !== value);
          if (newFilters[name].length === 0) delete newFilters[name];
        } else {
          newFilters[name] = [...newFilters[name], value];
        }
      }
      return newFilters;
    });
  };

  const applyFilters = () => {
    setLoading(true);

    let filtered = searchedProducts.filter(product => {
      const variantPrices = product.variants.map(v => v.price);
      const minProductPrice = Math.min(...variantPrices);
      const maxProductPrice = Math.max(...variantPrices);

      if (currentFilters.minPrice !== '' && maxProductPrice < Number(currentFilters.minPrice)) return false;
      if (currentFilters.maxPrice !== '' && minProductPrice > Number(currentFilters.maxPrice)) return false;

      if (currentFilters.category?.length > 0) {
        if (!currentFilters.category.includes(product.category)) return false;
      }

      for (const [key, values] of Object.entries(currentFilters)) {
        if (key.startsWith('property_') && values.length > 0) {
          const propertyName = key.replace('property_', '');
          
          const hasMatchingVariant = product.variants.some(variant => {
            if (!variant.properties || !variant.properties[propertyName]) return false;
            
            const variantValues = Array.isArray(variant.properties[propertyName]) 
              ? variant.properties[propertyName] 
              : [variant.properties[propertyName]];
              
            return values.some(value => 
              variantValues.some(v => v.toString().toLowerCase() === value.toString().toLowerCase())
            );
          });

          if (!hasMatchingVariant) return false;
        }
      }

      return true;
    });

    if (sortOrder === 'asc') {
      filtered.sort((a, b) => Math.min(...a.variants.map(v => v.price)) - Math.min(...b.variants.map(v => v.price)));
    } else if (sortOrder === 'desc') {
      filtered.sort((a, b) => Math.max(...b.variants.map(v => v.price)) - Math.max(...a.variants.map(v => v.price)));
    }

    setFilteredProducts(filtered);
    setLoading(false);
  };

  const handleSortChange = (order) => {
    setSortOrder(order === sortOrder ? null : order);
    setCurrentFilters(prev => ({ ...prev, sortOrder: order }));
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
    <div className="mx-auto px-4 py-8" dir="rtl">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex items-center justify-between mb-6"
      >
        <h1 className="text-xl font-semibold my-2">
          {`نتائج البحث عن "${query.replace(/"/g, '&quot;')}"`}
        </h1>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowFilters(!showFilters)}
          className="flex items-center bg-gray-500 text-white text-lg px-4 py-2 rounded-lg hover:bg-primary-dark transition"
        >
          <FaFilter className="mr-2" />
          {showFilters ? 'إخفاء الفلاتر' : 'إظهار الفلاتر'}
        </motion.button>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, x: -50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.3 }}
              className="col-span-1 bg-gray-500 p-4 rounded-lg shadow-lg"
            >
              <h2 className="text-xl font-semibold mb-4 text-white">الفلاتر</h2>

              {categories.length > 0 && (
                <div className="mb-4">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('categories')}>
                    <h3 className="font-semibold text-lg mb-2 text-white">الفئات</h3>
                    {openSections['categories'] ? <FaChevronUp className="text-white" /> : <FaChevronDown className="text-white" />}
                  </div>
                  {openSections['categories'] && (
                    <div className="space-y-2 mt-2">
                      {categories.map(cat => (
                        <label key={cat._id} className="flex items-center text-white">
                          <input
                            type="checkbox"
                            checked={currentFilters.category?.includes(cat._id)}
                            onChange={() => handleFilterChange('category', cat._id)}
                            className="mr-2"
                          />
                          {cat.name}
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="mb-4">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('price')}>
                  <label className="block text-base font-semibold text-white">نطاق السعر</label>
                  {openSections['price'] ? <FaChevronUp className="text-white" /> : <FaChevronDown className="text-white" />}
                </div>
                {openSections['price'] && (
                  <div className="flex space-x-2 mt-2">
                    <input
                      type="number"
                      name="minPrice"
                      placeholder="الحد الأدنى"
                      value={currentFilters.minPrice === '' ? '' : currentFilters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="w-1/2 border rounded p-2 bg-white"
                    />
                    <input
                      type="number"
                      name="maxPrice"
                      placeholder="الحد الأقصى"
                      value={currentFilters.maxPrice === '' ? '' : currentFilters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-1/2 border rounded p-2 bg-white"
                    />
                  </div>
                )}
              </div>

              {Object.entries(properties).map(([propertyName, values]) => (
                <div key={propertyName} className="mb-4">
                  <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection(propertyName)}>
                    <h3 className="font-semibold text-lg mb-2 text-white">{propertyName}</h3>
                    {openSections[propertyName] ? <FaChevronUp className="text-white" /> : <FaChevronDown className="text-white" />}
                  </div>
                  {openSections[propertyName] && (
                    <div className="space-y-2 mt-2">
                      {values.map(value => (
                        <label key={value} className="flex items-center text-white">
                          <input
                            type="checkbox"
                            checked={currentFilters[`property_${propertyName}`]?.includes(value)}
                            onChange={() => handleFilterChange(`property_${propertyName}`, value)}
                            className="mr-2"
                          />
                          <span className="text-base">{value}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              ))}

              <div className="mb-4">
                <div className="flex justify-between items-center cursor-pointer" onClick={() => toggleSection('sortOrder')}>
                  <h3 className="font-semibold mb-2 text-lg text-white">الترتيب</h3>
                  {openSections['sortOrder'] ? <FaChevronUp className="text-white" /> : <FaChevronDown className="text-white" />}
                </div>
                {openSections['sortOrder'] && (
                  <div className="space-y-2 mt-2">
                    <label className="flex items-center text-base text-white">
                      <input
                        type="checkbox"
                        checked={sortOrder === 'asc'}
                        onChange={() => handleSortChange('asc')}
                        className="mr-2"
                      />
                      <FaSortAmountUp className="mr-2 text-sm" />
                      السعر: الأرخص
                    </label>
                    <label className="flex items-center text-base text-white">
                      <input
                        type="checkbox"
                        checked={sortOrder === 'desc'}
                        onChange={() => handleSortChange('desc')}
                        className="mr-2"
                      />
                      <FaSortAmountDown className="mr-2 text-sm" />
                      السعر: الأغلى
                    </label>
                  </div>
                )}
              </div>

              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={applyFilters}
                className="w-full bg-accent text-white text-xl font-bold p-2 rounded-lg hover:bg-accent-dark transition"
              >
                تطبيق الفلاتر
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <div className={`col-span-1 ${showFilters ? 'md:col-span-3' : 'md:col-span-4'}`}>
          {filteredProducts.length === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-center py-8"
            >
              <FaSearch className="mx-auto text-4xl text-gray-400 mb-4" />
              <h2 className="text-2xl font-semibold">لا توجد نتائج</h2>
              <p className="text-gray-600 mt-2">حاول تعديل معايير البحث</p>
            </motion.div>
          ) : (
            <ProductsList products={filteredProducts} />
          )}
        </div>
      </div>
    </div>
  );
}
