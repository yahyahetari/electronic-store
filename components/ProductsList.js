import { motion } from "framer-motion";
import ProductBox from "./ProductBox";

// Animation variants for the container
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1 // Adjust this value to control the stagger delay
    }
  }
};

// Animation variants for each item
const itemVariants = {
  hidden: { opacity: 0, y: -50 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: "spring",
      stiffness: 100,
      damping: 12
    }
  }
};

export default function ProductsList({ products }) {
  return (
    <div>
      <motion.div 
        className="flex flex-row mt-4 mb-4 flex-wrap gap-2 sm:gap-4 justify-center"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {products?.length > 0 && products.map(product => (
          <motion.div key={product._id} variants={itemVariants}>
            <ProductBox {...product} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}
