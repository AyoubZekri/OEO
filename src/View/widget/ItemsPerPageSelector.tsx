import React from 'react';
import './ItemsPerPageSelector.css';

interface ItemsPerPageSelectorProps {
  itemsPerPage: number;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  onPageChange?: (page: number) => void;
}

export const ItemsPerPageSelector: React.FC<ItemsPerPageSelectorProps> = ({
  itemsPerPage,
  onItemsPerPageChange,
  onPageChange
}) => {
  return (
    <div className="items-per-page-container">
      <span className="ipp-label">إظهار</span>
      <select 
        className="ipp-select"
        value={itemsPerPage} 
        onChange={(e) => {
          onItemsPerPageChange(Number(e.target.value));
          if (onPageChange) onPageChange(1);
        }}
      >
        <option value={5}>5</option>
        <option value={10}>10</option>
        <option value={20}>20</option>
        <option value={50}>50</option>
        <option value={100}>100</option>
      </select>
      <span className="ipp-label">عنصر</span>
    </div>
  );
};
