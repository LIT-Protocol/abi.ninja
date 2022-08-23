import { Button, Card, Checkbox, Col, Modal, Row, Skeleton } from "antd";
import { useContractExistsAtAddress, useContractLoader } from "eth-hooks";
import React, { useEffect, useMemo, useState } from "react";
import Address from "../Address";
import Balance from "../Balance";
import DisplayVariable from "./DisplayVariable";
import FunctionForm from "./FunctionForm";
import { ArrowLeftOutlined, SettingOutlined } from "@ant-design/icons";
import ContractNavigation from "./ContractNavigation";

const isQueryable = fn => (fn.stateMutability === "view" || fn.stateMutability === "pure") && fn.inputs.length === 0;

export default function Contract({
  customContract,
  gasPrice,
  signer,
  provider,
  mainnetProvider,
  name,
  show,
  price,
  blockExplorer,
  chainId,
  contractConfig,
  selectedNetwork,
  reset,
}) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const contracts = useContractLoader(provider, contractConfig, chainId);
  let contract;
  if (!customContract) {
    contract = contracts ? contracts[name] : "";
  } else {
    contract = customContract;
  }

  const address = contract ? contract.address : "";
  const contractIsDeployed = useContractExistsAtAddress(provider, address);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [contractIsDeployed]);

  const displayedContractFunctions = useMemo(() => {
    const results = contract
      ? Object.entries(contract.interface.functions).filter(
          fn => fn[1]["type"] === "function" && !(show && show.indexOf(fn[1]["name"]) < 0),
        )
      : [];
    return results;
  }, [contract, show]);

  const allMethodsNames = [];
  displayedContractFunctions.forEach(contractFuncInfo => {
    const contractFunc =
      contractFuncInfo[1].stateMutability === "view" || contractFuncInfo[1].stateMutability === "pure"
        ? contract[contractFuncInfo[0]]
        : contract.connect(signer)[contractFuncInfo[0]];

    if (typeof contractFunc === "function") {
      if (!isQueryable(contractFuncInfo[1])) {
        allMethodsNames.push(contractFuncInfo[1].name);
      }
    }
  });

  const [seletectedContractMethods, setSeletectedContractMethods] = useState(allMethodsNames);
  const [refreshRequired, triggerRefresh] = useState(false);

  const contractVariablesDisplay = [];
  const contractMethodsDisplay = [];

  displayedContractFunctions.forEach(contractFuncInfo => {
    const contractFunc =
      contractFuncInfo[1].stateMutability === "view" || contractFuncInfo[1].stateMutability === "pure"
        ? contract[contractFuncInfo[0]]
        : contract.connect(signer)[contractFuncInfo[0]];

    if (typeof contractFunc === "function") {
      if (isQueryable(contractFuncInfo[1])) {
        // If there are no inputs, just display return value
        contractVariablesDisplay.push(
          <DisplayVariable
            key={contractFuncInfo[1].name}
            contractFunction={contractFunc}
            functionInfo={contractFuncInfo[1]}
            refreshRequired={refreshRequired}
            triggerRefresh={triggerRefresh}
            blockExplorer={blockExplorer}
          />,
        );
      } else {
        if (!seletectedContractMethods.includes(contractFuncInfo[1].name)) {
          return null;
        }

        contractMethodsDisplay.push(
          <FunctionForm
            key={"FF" + contractFuncInfo[0]}
            contractFunction={contractFunc}
            functionInfo={contractFuncInfo[1]}
            provider={provider}
            mainnetProvider={mainnetProvider}
            gasPrice={gasPrice}
            triggerRefresh={triggerRefresh}
            signer={signer}
          />,
        );
      }
    }
    return null;
  });

  const handleMethodChange = checkedValues => {
    setSeletectedContractMethods(checkedValues);
  };

  return (
    <div className="contract-component">
      <Row gutter={16} className="contract-component-row">
        <Col xs={0} md={4} className="contract-navigation">
          <ContractNavigation contractMethods={seletectedContractMethods} contractIsDeployed={contractIsDeployed} />
        </Col>
        <Col xs={24} md={12} className="contract-column">
          <Modal
            className="method-selection"
            title="Method selection"
            visible={isModalVisible}
            onOk={() => setIsModalVisible(false)}
            onCancel={() => setIsModalVisible(false)}
            footer={null}
          >
            <div style={{ marginBottom: 10 }}>
              <Button onClick={() => setSeletectedContractMethods(allMethodsNames)}>Select all</Button>
              <Button onClick={() => setSeletectedContractMethods([])}>Remove all</Button>
            </div>
            <Checkbox.Group options={allMethodsNames} value={seletectedContractMethods} onChange={handleMethodChange} />
          </Modal>
          <div className="contract-top-controls">
            <Button className="return-button" type="link" onClick={reset}>
              <ArrowLeftOutlined style={{ fontSize: "16px", cursor: "pointer" }} /> Return
            </Button>
            <SettingOutlined style={{ fontSize: "20px", cursor: "pointer" }} onClick={() => setIsModalVisible(true)} />
          </div>
          <Card
            className="contract-methods-display"
            size="large"
            style={{ marginTop: 15, width: "100%" }}
            loading={contractMethodsDisplay && contractMethodsDisplay.length <= 0}
          >
            {contractIsDeployed ? contractMethodsDisplay : <Skeleton active />}
          </Card>
        </Col>
        <Col xs={24} md={8} style={{ marginTop: 30 }} className="contract-variables">
          <div className="contract-top-controls">
            <Button className="return-button" type="link" onClick={reset}>
              <ArrowLeftOutlined style={{ fontSize: "16px", cursor: "pointer" }} /> Return
            </Button>
          </div>
          <Card
            className="contract-variables-display"
            title={
              <div style={{ fontSize: 18 }}>
                <span style={{ color: selectedNetwork.color }}>{selectedNetwork.name}</span>
                <div style={{ float: "right" }}>
                  <Address value={address} blockExplorer={blockExplorer} fontSize={18} />
                  <Balance address={address} provider={provider} price={price} fontSize={18} />
                </div>
              </div>
            }
            size="large"
            style={{ marginTop: 18, width: "100%" }}
            loading={contractVariablesDisplay && contractVariablesDisplay.length <= 0}
          >
            {contractIsDeployed ? contractVariablesDisplay : <Skeleton active />}
          </Card>
        </Col>
      </Row>
    </div>
  );
}
