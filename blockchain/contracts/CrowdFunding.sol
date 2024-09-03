// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/**
 * @dev CrowdFundingFactory는 여러 개의 크라우드펀딩 프로젝트를 관리하는 스마트 컨트랙트입니다.
 * 각 프로젝트는 독립적으로 관리되며, 프로젝트 소유자는 목표 금액에 도달했을 때 자금을 인출할 수 있습니다.
 */
contract CrowdFundingFactory {
    struct Project {
        address owner;
        string title;
        string description;
        uint goal;
        uint deadline;
        uint pledgedAmount;
        bool isWithdrawn;
        mapping(address => uint) contributions;
    }

    Project[] public projects;

    event ProjectCreated(uint projectId, address owner, uint goal, uint deadline, string title, string description);

    function createProject(
        string calldata _title,
        string calldata _description,
        uint _goal,
        uint _duration
    ) external {
        Project storage newProject = projects.push();
        newProject.owner = msg.sender;
        newProject.title = _title;
        newProject.description = _description;
        newProject.goal = _goal;
        newProject.deadline = block.timestamp + _duration;
        newProject.isWithdrawn = false;

        emit ProjectCreated(projects.length - 1, msg.sender, _goal, newProject.deadline, _title, _description);
    }

    function contribute(uint projectId) external payable {
        Project storage project = projects[projectId];
        require(block.timestamp < project.deadline, "Funding period is over");
        require(!project.isWithdrawn, "Funding has been withdrawn");

        project.contributions[msg.sender] += msg.value;
        project.pledgedAmount += msg.value;
    }

    function withdraw(uint projectId) external {
        Project storage project = projects[projectId];
        require(msg.sender == project.owner, "Only owner can withdraw");
        require(block.timestamp >= project.deadline, "Funding period is not over");
        require(project.pledgedAmount >= project.goal, "Funding goal not reached");
        require(!project.isWithdrawn, "Funds have already been withdrawn");

        project.isWithdrawn = true;
        payable(project.owner).transfer(project.pledgedAmount);
    }

    function refund(uint projectId) external {
        Project storage project = projects[projectId];
        require(block.timestamp >= project.deadline, "Funding period is not over");
        require(project.pledgedAmount < project.goal, "Funding goal was reached");

        uint amount = project.contributions[msg.sender];
        require(amount > 0, "No contributions from sender");

        project.contributions[msg.sender] = 0;
        payable(msg.sender).transfer(amount);
    }

    function getContribution(uint projectId, address contributor) external view returns (uint) {
        return projects[projectId].contributions[contributor];
    }

    function getProjectCount() external view returns (uint) {
        return projects.length;
    }

    /**
     * @dev 특정 프로젝트의 정보를 반환하는 함수입니다.
     * @param projectId 프로젝트의 ID
     * @return title 프로젝트의 제목
     * @return description 프로젝트의 설명
     * @return goal 프로젝트의 목표 금액
     * @return pledgedAmount 현재 모금된 금액
     * @return deadline 프로젝트의 마감일
     * @return owner 프로젝트의 소유자 주소
     */
    function getProjectDetails(uint projectId)
        external
        view
        returns (
            string memory title,
            string memory description,
            uint goal,
            uint pledgedAmount,
            uint deadline,
            address owner
        )
    {
        Project storage project = projects[projectId];
        return (
            project.title,
            project.description,
            project.goal,
            project.pledgedAmount,
            project.deadline,
            project.owner
        );
    }
}
