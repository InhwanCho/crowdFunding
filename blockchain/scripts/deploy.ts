import { ethers } from "hardhat";

// @dev 주어진 금액을 이더 단위로 변환하는 함수입니다.
// - `amount`: 변환할 금액 (숫자 또는 문자열)
// @return 이더 단위로 변환된 금액
const toEther = (amount: any) => ethers.parseEther(amount.toString());

async function main() {
  // @dev 배포할 계정 가져오기
  const [deployer] = await ethers.getSigners();

  // @dev CrowdFundingFactory 컨트랙트를 배포
  const factory = await ethers.getContractFactory("CrowdFundingFactory");
  const crowdFundingFactory = await factory.deploy();
  await crowdFundingFactory.waitForDeployment();

  console.log(`CrowdFundingFactory deployed by: ${deployer.address}`);
  console.log(`Factory contract address: ${crowdFundingFactory.target}`);

  // @dev 첫 번째 프로젝트 생성
  const title = "첫 번째 프로젝트";
  const description = "이 프로젝트는 스마트 컨트랙트를 테스트하기 위한 것입니다.";
  const goal = toEther("10"); // 목표 금액 10 ETH
  const duration = 7 * 24 * 60 * 60; // 7일 기간 (초 단위)

  const tx = await crowdFundingFactory.createProject(title, description, goal, duration);
  await tx.wait();

  console.log(`First project created with title: "${title}", goal: 10 ETH, and duration: 7 days`);
}

// @dev 에러 핸들링을 위한 main 함수 호출
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
