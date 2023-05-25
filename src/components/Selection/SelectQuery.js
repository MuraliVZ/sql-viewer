import { DataQuery } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, CircularLoader, IconMore24, IconSettings24 } from '@dhis2/ui'
import PropTypes from 'prop-types'
import React, { createRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAttribute } from '../AttributeProvider'
import LinksMenu from '../Data/LinksMenu'
import CustomTablequery from '../Table/Customtablequery'
import { useUserInfo } from '../UserInfoProvider'
import SettingsModal from './SettingsModal'

const sqlViewsQuery = {
    sql: {
        resource: 'sqlViews',
        params: {
            paging: false,
            fields: 'id,name,displayName',
        },
    },
}

const LinksButton = ({ id }) => {
    const moreButtonRef = createRef()
    const [linksMenuOpen, setLinksMenuOpen] = useState(false)

    const toggleLinksMenu = () => {
        setLinksMenuOpen(!linksMenuOpen)
    }

    return (
        <>
            <div ref={moreButtonRef} className="buttonWrapLeft">
                <Button
                    dataTest={`moreButton_${id}`}
                    icon={<IconMore24 />}
                    small
                    onClick={() => {
                        toggleLinksMenu()
                    }}
                />
            </div>
            {linksMenuOpen && (
                <LinksMenu
                    id={id}
                    isSearchPage={true}
                    moreButtonRef={moreButtonRef}
                    toggleLinksMenu={toggleLinksMenu}
                />
            )}
        </>
    )
}

LinksButton.propTypes = {
    id: PropTypes.string,
}

const SelectQuery = () => {
    const selectHeaders = [
        { name: i18n.t('name') },
        '',
        { name: 'uid', hidden: true },
    ]

    const { userInfo } = useUserInfo()
    const { attribute } = useAttribute()
    const [settingsModalOpen, setSettingsModalOpen] = useState(false)

    return (
        <DataQuery query={sqlViewsQuery}>
            {({ loading, error, data }) => (
                <>
                    <div className="innerContainer">
                        {settingsModalOpen && (
                            <SettingsModal
                                setSettingsModalOpen={setSettingsModalOpen}
                            />
                        )}

                        <div className="headerContainer">
                            <h1 className="titleText">{i18n.t('SQL Views')}</h1>
                            {userInfo?.superuser &&
                                !attribute?.defaultsAttributeId && (
                                    <div className="rightButton">
                                        <Button
                                            dataTest="settings-button"
                                            icon={<IconSettings24 />}
                                            small
                                            onClick={() => {
                                                setSettingsModalOpen(true)
                                            }}
                                        />
                                    </div>
                                )}
                        </div>
                        {loading && <CircularLoader />}
                        {error && <span>{`Error: ${error.message}`}</span>}
                        {data && (
                            <CustomTablequery
                                persistSearch={true}
                                searchable={true}
                                searchableDescription={`${String.fromCharCode(
                                    55357,
                                    56589
                                )} ${i18n.t('Search for a SQL view')}`}
                                tableData={data.sql.sqlViews.map(d => {
                                    return [
                                        {
                                            display: (
                                                <div key={`${d.id}_view`}>
                                                    <Link
                                                        to={`/view/${d.id}`}
                                                        
    

                                                        style={{
                                                            textDecoration:
                                                                'none',
                                                        }}
                                                    >
                                                        <span
                                                            style={{
                                                                color: 'black',
                                                            }}
                                                        >
                                                            {d.displayName}
                                                        </span>
                                                    </Link>
                                                </div>
                                            ),
                                            text: d.displayName,
                                        },
                                        {
                                            display: <LinksButton id={d.id} />,
                                        },
                                        d.id,
                                    ]
                                })}
                                tableColumns={selectHeaders}
                            />
                        )}
                    </div>
                    <style jsx>{`
                        .titleText {
                            font-size: 24px;
                            font-weight: 700;
                            color: var(--colors-grey800);
                            margin: var(--spacers-dp24) 0 var(--spacers-dp12);
                            line-height: 20px;
                        }
                        .headerContainer {
                            display: flex;
                            align-items: center;
                        }
                        .rightButton {
                            margin-left: auto;
                        }
                    `}</style>
                </>
            )}
        </DataQuery>
    )
}

export default SelectQuery
