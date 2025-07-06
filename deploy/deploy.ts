import { DeployFunction } from "hardhat-deploy/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";

const func: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
  const { deployer } = await hre.getNamedAccounts();
  const { deploy } = hre.deployments;

  const deployedFHECounter = await deploy("Zamamind", {
    from: deployer,
    log: true,
  });

  console.log(`Zamamind contract: `, deployedFHECounter.address);
};
export default func;
func.id = "deploy_zamamind"; // id required to prevent reexecution
func.tags = ["Zamamind"];
