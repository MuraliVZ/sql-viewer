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
  const [selectedColumns, setSelectedColumns] = useState([]);

  const [pagePosition, setPagePosition] = useState(0);
  const [maxRows, setMaxRows] = useState(
    tableData.length > 500 ? 500 : tableData.length
  );

  const getColumnDistinctValues = (column) => {
    const columnIndex = tableColumns.findIndex((col) => col.name === column);
    const distinctValues = Array.from(
      new Set(tableData.map((data) => data[columnIndex]))
    );
    return distinctValues.filter((value) => value !== null);
  };

  const filterBySearch = (data, filterValues) => {
    setPagePosition(0);
    setFilteredRows(
      data.filter((datim) =>
        selectedColumns.every((columnName) => {
          const columnIndex = tableColumns.findIndex(
            (column) => column.name === columnName
          );
          const columnValue = datim[columnIndex];
          const filterValue = filterValues[columnName] || '';
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
    setFilterValues((prevFilterValues) => ({
      ...prevFilterValues,
      [columnName]: filterValue,
    }));
  };

  const handleColumnSelectChange = (e) => {
    const selectedColumn = e.target.value;
    setSelectedColumns((prevSelectedColumns) => {
      if (!prevSelectedColumns.includes(selectedColumn)) {
        return [...prevSelectedColumns, selectedColumn];
      }
      return prevSelectedColumns;
    });
    setFilterValues((prevFilterValues) => ({
      ...prevFilterValues,
      [selectedColumn]: '',
    }));
    setFilteredRows(tableData);
  };

  const handleRemoveColumn = (columnName) => {
    setSelectedColumns((prevSelectedColumns) =>
      prevSelectedColumns.filter((column) => column !== columnName)
    );
    setFilterValues((prevFilterValues) => {
      const { [columnName]: removedValue, ...restFilterValues } = prevFilterValues;
      return restFilterValues;
    });
    setFilteredRows(tableData);
  };

  return (
    <div className="custom-table">
      <div className="filter-container">
        <select
          className="column-select"
          value=""
          onChange={handleColumnSelectChange}
        >
          <option value="">Select Column</option>
          {tableColumns.slice(0, 3).map((column, index) => (
            <option key={index} value={column.name}>
              {column.name}
            </option>
          ))}
        </select>
        <div className="selected-columns">
          {selectedColumns.map((selectedColumn) => (
            <div key={selectedColumn} className="filter-input-container">
              <select
                className="filter-input"
                value={filterValues[selectedColumn] || ''}
                onChange={(e) =>
                  handleFilterInputChange(selectedColumn, e.target.value)
                }
              >
                <option value="">All</option>
                {getColumnDistinctValues(selectedColumn).map((value, index) => (
                  <option key={index} value={value}>
                    {value}
                  </option>
                ))}
              </select>
              <button
                className="remove-column-button"
                onClick={() => handleRemoveColumn(selectedColumn)}
              >
                X
              </button>
            </div>
          ))}
        </div>
        {selectedColumns.length >= 0 && (
          <button className="apply-filter-button" onClick={setSearchText}>
            Apply Filter
          </button>
        )}
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
