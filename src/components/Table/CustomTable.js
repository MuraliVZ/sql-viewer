import PropTypes from 'prop-types';
import React, { useState } from 'react';
import CustomTableBody from './CustomTableBody';
import CustomTableFooter from './CustomTableFooter';
import TableQueryRow from './TableQueryRow';

import './CustomTable.css'; // Import CSS file for CustomTable styles

const CustomTable = ({
  persistSearch,
  searchable,
  searchableDescription,
  refreshQuery,
  tableData,
  tableColumns,
  downloadURL,
}) => {
  const [filteredRows, setFilteredRows] = useState(tableData);
  const [filterValues, setFilterValues] = useState({});
  const [selectedColumn, setSelectedColumn] = useState('');

  const [pagePosition, setPagePosition] = useState(0);
  const [maxRows, setMaxRows] = useState(
    tableData.length > 500 ? 500 : tableData.length
  );

  const filterBySearch = (data, filterValues) => {
    setPagePosition(0);
    setFilteredRows(
      data.filter(datim =>
        Object.entries(filterValues).every(([columnName, filterValue]) => {
          const columnIndex = tableColumns.findIndex(
            column => column.name === columnName
          );
          const columnValue = datim[columnIndex];
          return (
            columnValue !== null &&
            ((columnValue.text || columnValue)
              .toString()
              .toLowerCase()
              .indexOf(filterValue.toLowerCase()) >= 0)
          );
        })
      )
    );
  };

  const setSearchText = () => {
    filterBySearch(tableData, filterValues);
  };

  const handleFilterInputChange = (columnName, filterValue) => {
    setFilterValues(prevFilterValues => ({
      ...prevFilterValues,
      [columnName]: filterValue,
    }));
  };

  const handleColumnSelectChange = e => {
    setSelectedColumn(e.target.value);
  };

  return (
    <div className="custom-table">
      <div className="filter-container">
        <select
          className="column-select"
          value={selectedColumn}
          onChange={handleColumnSelectChange}
        >
          <option value="">Select Column</option>
          {tableColumns.map((column, index) => (
            <option key={index} value={column.name}>
              {column.name}
            </option>
          ))}
        </select>
        {selectedColumn && (
          <input
            className="filter-input"
            type="text"
            value={filterValues[selectedColumn] || ''}
            onChange={e =>
              handleFilterInputChange(selectedColumn, e.target.value)
            }
            placeholder="Enter Filter Value"
          />
        )}
        <button className="apply-filter-button" onClick={setSearchText}>
          Apply Filter
        </button>
      </div>
      <TableQueryRow
        maxRows={maxRows}
        persistSearch={persistSearch}
        searchableDescription={searchableDescription}
        setSearchText={searchable ? setSearchText : null}
        refreshQuery={refreshQuery}
        rowCount={filteredRows.length}
        totalRows={tableData.length}
        tableColumns={tableColumns}
        onFilterInputChange={handleFilterInputChange}
        filterValues={filterValues}
      />
      <CustomTableBody
        pagePosition={pagePosition}
        maxRows={maxRows}
        rows={filteredRows}
        totalRows={tableData.length}
        headers={tableColumns}
        downloadURL={downloadURL}
      />
      <CustomTableFooter
        downloadURL={downloadURL}
        enablePagination={tableData.length > 500 ? true : false}
        maxRows={maxRows}
        setMaxRows={setMaxRows}
        rowCount={filteredRows.length}
        totalRows={tableData.length}
        pagePosition={pagePosition}
        setPagePosition={setPagePosition}
      />
    </div>
  );
};

CustomTable.propTypes = {
  downloadURL: PropTypes.string,
  persistSearch: PropTypes.bool,
  refreshQuery: PropTypes.func,
  searchable: PropTypes.bool,
  searchableDescription: PropTypes.string,
  tableColumns: PropTypes.array,
  tableData: PropTypes.array,
};

export default CustomTable;
