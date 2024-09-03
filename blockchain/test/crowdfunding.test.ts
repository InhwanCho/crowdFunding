import { expect } from "chai";
import { ethers } from "hardhat";
import { CrowdFundingFactory, CrowdFundingFactory__factory } from "../typechain-types";

type SignerWithAddress = Awaited<ReturnType<typeof ethers.getSigners>>[0];

describe("CrowdFundingFactory - 크라우드펀딩 팩토리 스마트 컨트랙트 테스트", function () {
  let crowdFundingFactory: CrowdFundingFactory;
  let owner: SignerWithAddress;
  let addr1: SignerWithAddress;
  let addr2: SignerWithAddress;
  let addrs: SignerWithAddress[];

  const title = "테스트 프로젝트";
  const description = "이 프로젝트는 테스트를 위해 생성되었습니다.";
  const goal = ethers.parseEther("10");
  const duration = 7 * 24 * 60 * 60;

  beforeEach(async function () {
    [owner, addr1, addr2, ...addrs] = await ethers.getSigners();

    const factory = (await ethers.getContractFactory("CrowdFundingFactory")) as unknown as CrowdFundingFactory__factory;

    crowdFundingFactory = (await factory.deploy()) as unknown as CrowdFundingFactory;

    await crowdFundingFactory.waitForDeployment();

    const tx = await crowdFundingFactory.createProject(title, description, goal, duration);
    await tx.wait();
  });

  it("Should create a new project - 새로운 프로젝트가 생성되는지 테스트", async function () {
    const projectCount = await crowdFundingFactory.getProjectCount();
    expect(projectCount).to.equal(1);
  });

  it("Should set the right owner for the project - 프로젝트 소유자가 올바르게 설정되는지 테스트", async function () {
    const project = await crowdFundingFactory.projects(0);
    expect(project.owner).to.equal(owner.address);
    expect(project.title).to.equal(title);
    expect(project.description).to.equal(description);
  });

  it("Should accept contributions to a project - 프로젝트에 기부가 정상적으로 이루어지는지 테스트", async function () {
    const projectId = 0;
    await crowdFundingFactory.connect(addr1).contribute(projectId, { value: ethers.parseEther("1") });

    const project = await crowdFundingFactory.projects(projectId);
    const contribution = await crowdFundingFactory.getContribution(projectId, addr1.address);
    expect(contribution).to.equal(ethers.parseEther("1"));
    expect(project.pledgedAmount).to.equal(ethers.parseEther("1"));
  });

  it("Should allow the owner to withdraw funds if the goal is reached - 목표 금액에 도달했을 때 소유자가 자금을 인출할 수 있는지 테스트", async function () {
    const projectId = 0;
    await crowdFundingFactory.connect(addr1).contribute(projectId, { value: ethers.parseEther("5") });
    await crowdFundingFactory.connect(addr2).contribute(projectId, { value: ethers.parseEther("6") });

    const initialBalance = await ethers.provider.getBalance(owner.address);

    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine", []);

    await crowdFundingFactory.connect(owner).withdraw(projectId);

    const finalBalance = await ethers.provider.getBalance(owner.address);
    expect(finalBalance).to.be.above(initialBalance);
  });

  it("Should allow contributors to refund if the goal is not reached - 목표 금액에 도달하지 못한 경우 기부자들이 환불받을 수 있는지 테스트", async function () {
    const projectId = 0;
    await crowdFundingFactory.connect(addr1).contribute(projectId, { value: ethers.parseEther("5") });

    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine", []);

    const initialBalance = await ethers.provider.getBalance(addr1.address);

    await crowdFundingFactory.connect(addr1).refund(projectId);

    const finalBalance = await ethers.provider.getBalance(addr1.address);
    expect(finalBalance).to.be.above(initialBalance);
  });

  it("Should not allow refunds if the goal is reached - 목표 금액에 도달한 경우 환불이 불가능한지 테스트", async function () {
    const projectId = 0;
    await crowdFundingFactory.connect(addr1).contribute(projectId, { value: ethers.parseEther("5") });
    await crowdFundingFactory.connect(addr2).contribute(projectId, { value: ethers.parseEther("6") });

    await ethers.provider.send("evm_increaseTime", [duration + 1]);
    await ethers.provider.send("evm_mine", []);

    await expect(crowdFundingFactory.connect(addr1).refund(projectId)).to.be.revertedWith("Funding goal was reached");
  });
});
