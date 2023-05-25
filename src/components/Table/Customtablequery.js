import PropTypes from 'prop-types'
import React, { useState } from 'react'
import CustomTableBody from './CustomTableBody'
import CustomTableFooter from './CustomTableFooter'
import TableQueryRow from './TableQueryRow'

const CustomTablequery = ({
    persistSearch,
    searchable,
    searchableDescription,
    refreshQuery,
    tableData,
    tableColumns,
    downloadURL,
}) => {
    const [filteredRows, setFilteredRows] = useState(tableData)

    const [pagePosition, setPagePosition] = useState(0)
    const [maxRows, setMaxRows] = useState(
        tableData.length > 500 ? 500 : tableData.length
    )

    const filterBySearch = (data, searchTerm) => {
        setPagePosition(0)
        setFilteredRows(
            data.filter(
                datim =>
                    datim.filter(i =>
                        i === null
                            ? false
                            : (i.text || i)
                                  .toString()
                                  .toLowerCase()
                                  .indexOf(searchTerm.toLowerCase()) >= 0
                    ).length > 0
            )
        )
    }

    const setSearchText = searchTerm => {
        filterBySearch(tableData, searchTerm)
    }

    return (
        
        <>
            <TableQueryRow
                maxRows={maxRows}
                persistSearch={persistSearch}
                searchableDescription={searchableDescription}
                setSearchText={searchable ? setSearchText : null}
                refreshQuery={refreshQuery}
                rowCount={filteredRows.length}
                totalRows={tableData.length}
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
        </>
    )
}

CustomTablequery.propTypes = {
    downloadURL: PropTypes.string,
    persistSearch: PropTypes.bool,
    refreshQuery: PropTypes.func,
    searchable: PropTypes.bool,
    searchableDescription: PropTypes.string,
    tableColumns: PropTypes.array,
    tableData: PropTypes.array,
}
export default CustomTablequery
