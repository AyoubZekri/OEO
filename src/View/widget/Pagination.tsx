import React from 'react';
import './Pagination.css';

interface PaginationProps {
  totalItems: number;
  itemsPerPage: number;
  currentPage: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
}

export const Pagination: React.FC<PaginationProps> = ({
  totalItems,
  itemsPerPage,
  currentPage,
  onPageChange,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage) || 1;

  const handlePrev = () => {
    if (currentPage > 1) onPageChange(currentPage - 1);
  };

  const handleNext = () => {
    if (currentPage < totalPages) onPageChange(currentPage + 1);
  };

  const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="pagination-container">
      <div className="pagination-left">
        <span className="pagination-info-text">
          عرض {startItem} إلى {endItem} من أصل {totalItems} مدخلات
        </span>
      </div>
      
      <div className="pagination-right">
        <div className="pagination-controls">
          <button 
            className="pagination-btn-text"
            onClick={handlePrev} 
            disabled={currentPage <= 1}
          >
            السابق
          </button>
          
          <div className="pagination-btn-page">
            {currentPage}
          </div>

          <button 
            className="pagination-btn-text"
            onClick={handleNext} 
            disabled={currentPage >= totalPages}
          >
            التالي
          </button>
        </div>
      </div>
    </div>
  );
};
