import { useAlert, useConfig, useDataEngine } from '@dhis2/app-runtime'
import i18n from '@dhis2/d2-i18n'
import { Button, CircularLoader, IconArrowLeft24, IconMore24 } from '@dhis2/ui'
import PropTypes from 'prop-types'
import React, { useEffect, useState, createRef } from 'react'
import { Link } from 'react-router-dom'
import { executeQuery } from '../../api/miscellaneous'
import {
    checkIfAllNull,
    extractVariables,
    getVariablesLink,
    populateDefaultVariables,
} from '../../services/extractVariables'
import { useQuery } from '../../services/useQuery'
import { useAttribute } from '../AttributeProvider'
import Layout from '../Layout'
import { useUserInfo } from '../UserInfoProvider'
import DataWrapper from './DataWrapper'
import ErrorMessage from './ErrorMessage'
import LinksMenu from './LinksMenu'
import VariablesDrawerMenu from './VariablesDrawerMenu'
import VariablesSummaryLine from './VariablesSummaryLine'

const sqlViewDetail = {
    sqlView: {
        resource: 'sqlViews',
        id: ({ id }) => id,
    },
}

const sqlUpdate = {
    resource: 'sqlViews',
    id: ({ id }) => id,
    type: 'update',
    partial: false,
    params: { mergeMode: 'REPLACE' },
    data: ({ data }) => data,
}

const ALERT_MESSAGES = {
    resetSuccess: {
        msg: i18n.t(
            'Variables have been reset. Refresh query to refresh data.'
        ),
    },
    saveFail: {
        msg: i18n.t('Default variables could not be updated.'),
        options: { warning: true },
    },
    saveSuccess: {
        msg: i18n.t('Default variables updated.'),
        options: { success: true },
    },
}

const VIEW_TYPE = 'VIEW'
const QUERY_TYPE = 'QUERY'

const BackButton = () => (
    <>
        <div className="backButtonWrap">
            <Link
                to={`/`}
                style={{
                    textDecoration: 'none',
                }}
            >
                <Button dataTest={'back-to-search'} icon={<IconArrowLeft24 />}>
                    {i18n.t('Back')}
                </Button>
            </Link>
        </div>
        <style jsx>{`
            .backButtonWrap {
                display: flex;
                margin-left: auto;
            }
        `}</style>
    </>
)

const ViewData = ({ match }) => {
    const { baseUrl } = useConfig()
    const {attribute, attributeWaiting} = useAttribute()
    const { userInfo } = useUserInfo()
    const query = useQuery()
    const engine = useDataEngine()
    const id = match.params.id
    const [variablesDrawerOpen, setVariablesDrawerOpen] = useState(true)
    const [variables, setVariables] = useState({})
    const [queryExecuted, setQueryExecuted] = useState(false)
    const [linksMenuOpen, setLinksMenuOpen] = useState(false)
    const [refreshQuery, setRefreshQuery] = useState(null)
    const [executeError, setExecuteError] = useState(null)
    const [data, setData] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [defaultsAvailable, setDefaultsAvailable] = useState(false)
    const { show: showAlert } = useAlert(
        ({ msg }) => msg,
        ({ options }) => ({ ...options, duration: 3000 })
    )

    const toggleLinksMenu = () => {
        setLinksMenuOpen(!linksMenuOpen)
    }

    useEffect(() => {
        if (!attributeWaiting) {
           const getEngineResults = async id => {
                try {
                    const { sqlView } = await engine.query(sqlViewDetail, {
                        variables: { id: id },
                    })
                    prepView({ sqlView })
                } catch (e) {
                    setError(e)
                } finally {
                    setLoading(false)
                }
            }
            getEngineResults(id)
        }
    }, [attribute, attributeWaiting, id])

    const prepView = async d => {
        let extractedVariables = extractVariables(d.sqlView.sqlQuery)
        if (attribute?.defaultsAttributeId) {
            try {
                extractedVariables = populateDefaultVariables(
                    extractedVariables,
                    d.sqlView.attributeValues,
                    attribute?.defaultsAttributeId
                )
                if (!checkIfAllNull(extractedVariables)) {
                    setDefaultsAvailable(true)
                }
            } catch (e) {
                showAlert({
                    msg: e.message,
                    options: { warning: true, duration: 3000 },
                })
            }
        }

        if (
            d.sqlView.type !== QUERY_TYPE ||
            Object.keys(extractedVariables).length === 0
        ) {
            setVariablesDrawerOpen(false)
        }

        Object.keys(extractedVariables).forEach(k => {
            if (query[k]) {
                extractedVariables[k] = query[k]
            }
        })
        setVariables(extractedVariables)

        if (d.sqlView.type === VIEW_TYPE) {
            executeQuery.resource = `sqlViews/${id}/execute`
            try {
                const resp = await engine.mutate(executeQuery)
                if (resp) {
                    setQueryExecuted(true)
                }
            } catch (e) {
                setExecuteError(e)
            } finally {
                setQueryExecuted(true)
                setData(d)
            }
        } else {
            setQueryExecuted(true)
            setData(d)
        }
    }
      
    const updateVariable = newVariable => {
        const updatedVariables = Object.assign({}, variables, newVariable)
        window.history.pushState(
            null,
            null,
            getVariablesLink({ id, variables: updatedVariables, baseUrl })
        )
        setVariables(updatedVariables)
    }

    const resetDefaults = () => {
        try {
            const tempVariables = populateDefaultVariables(
                variables,
                data.sqlView.attributeValues,
                attribute?.defaultsAttributeId
            )

            window.history.pushState(
                null,
                null,
                getVariablesLink({ id, variables: tempVariables, baseUrl })
            )

            setVariables(tempVariables)
            showAlert(ALERT_MESSAGES.resetSuccess)
        } catch (e) {
            showAlert({ msg: e.message, options: { warning: true } })
        }
    }

    const saveDefaults = async () => {
        try {
            const filteredAttributeValues = data.sqlView.attributeValues.filter(
                av => av.attribute.id !== attribute?.defaultsAttributeId
                
            )
            const newVariables = {
                attribute: { id: attribute?.defaultsAttributeId },
                value: JSON.stringify(variables),
            }
            const newSQLView = { ...data.sqlView }
            newSQLView.attributeValues = [
                ...filteredAttributeValues,
                newVariables,
            ]

            const response = await engine.mutate(sqlUpdate, {
                variables: { id: data.sqlView.id, data: newSQLView },
            })
            if (
                response?.httpStatusCode === undefined ||
                response?.httpStatusCode < 200 ||
                response?.httpStatusCode >= 400
            ) {
                showAlert(ALERT_MESSAGES.saveFail)
            } else {
                showAlert(ALERT_MESSAGES.saveSuccess)
                setData({ sqlView: newSQLView })
            }
        } catch (e) {
            showAlert(ALERT_MESSAGES.saveFail)
        }
    }

    const toggleVariableDrawer = () => {
        setVariablesDrawerOpen(!variablesDrawerOpen)
    }

    const moreButtonRef = createRef()

    return (
        <Layout>
            <>
                {!error && (loading || !queryExecuted) && <CircularLoader />}
                {error && (
                    <>
                        <div className="marginWrap flexWrap">
                            <BackButton />
                        </div>
                        <ErrorMessage error={error} />
                    </>
                )}
                {userInfo && data && queryExecuted && (
                    <div className="container">
                        <div
                            className={
                                variablesDrawerOpen
                                    ? 'drawerWrapper'
                                    : 'drawerWrapper inactive'
                            }
                        >
                            <VariablesDrawerMenu
                                variables={variables}
                                toggleVariableDrawer={toggleVariableDrawer}
                                updateVariable={updateVariable}
                                refreshQuery={refreshQuery}
                                resetDefaults={resetDefaults}
                                defaultsConfigured={
                                    attribute?.defaultsAttributeId !== undefined
                                }
                                defaultsAvailable={defaultsAvailable}
                                saveDefaults={saveDefaults}
                                allowSave={
                                    userInfo.superuser ||
                                    data?.sharing?.owner === userInfo?.id
                                }
                            />
                            <div className="main">
                                <div className="marginWrap">
                                    <div className="flexWrap">
                                        <span className="queryTitleText">
                                            {data.sqlView.name}
                                        </span>
                                        <div
                                            ref={moreButtonRef}
                                            className="buttonWrapLeft"
                                        >
                                            <Button
                                                dataTest="moreButton_view"
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
                                                isSearchPage={false}
                                                moreButtonRef={moreButtonRef}
                                                toggleLinksMenu={
                                                    toggleLinksMenu
                                                }
                                                variables={variables}
                                            />
                                        )}
                                        <BackButton />
                                    </div>
                                    {Object.keys(variables).length > 0 &&
                                        !variablesDrawerOpen && (
                                            <VariablesSummaryLine
                                                variables={variables}
                                                toggleVariableDrawer={
                                                    toggleVariableDrawer
                                                }
                                            />
                                        )}
                                    {
                                        <DataWrapper
                                            id={id}
                                            initialExecuteError={executeError}
                                            variables={variables}
                                            isView={
                                                data.sqlView.type === VIEW_TYPE
                                            }
                                            setRefreshQuery={setRefreshQuery}
                                        />
                                    }
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </>
            <style jsx>{`
                .container {
                    width: 100%;
                    height: 100%;
                    font-size: 1rem;
                }
                .main {
                    width: 100%;
                    overflow: auto;
                }
                .marginWrap {
                    margin: var(--spacers-dp12) var(--spacers-dp16)
                        var(--spacers-dp12) var(--spacers-dp16);
                }
                .drawerWrapper {
                    position: relative;
                    display: flex;
                    overflow: hidden;
                    height: 100%;
                    top: 0;
                    left: 0;
                    transition: margin 0.6s cubic-bezier(0.42, 0, 0.58, 1);
                }
                .inactive {
                    margin-left: -300px;
                }
                .flexWrap {
                    display: flex;
                    align-items: center;
                }
                .queryTitleText {
                    font-size: 24px;
                    font-weight: 700;
                    color: var(--colors-grey800);
                    margin: var(--spacers-dp12) 0;
                    line-height: 20px;
                }
                .buttonWrapLeft {
                    margin-left: var(--spacers-dp12);
                }
                .linkButton {
                    margin-right: 8px;
                }
            `}</style>
        </Layout>
    )
}

ViewData.propTypes = {
    match: PropTypes.object,
}

export default ViewData
