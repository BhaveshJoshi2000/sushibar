const { assert, expect } = require("chai")
const { network, ethers, deployments } = require("hardhat")
const { developmentChains } = require("../helper-hardhat-config")
const { time } = require("@nomicfoundation/hardhat-network-helpers")

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("SushiBar", function () {
          let sushiBarContract, sushiBar, sushiTokenContract, sushiToken, deployer, bob, alice
          const threeDays = 3 * 24 * 60 * 60
          const fiveDays = 5 * 24 * 60 * 60
          const sevenDays = 7 * 24 * 60 * 60
          beforeEach(async function () {
              const accounts = await ethers.getSigners()
              deployer = accounts[0]
              bob = accounts[1]
              alice = accounts[2]
              await deployments.fixture(["all"])

              sushiTokenContract = await ethers.getContract("SushiToken")
              sushiToken = sushiTokenContract.connect(deployer)

              sushiBarContract = await ethers.getContract("SushiBar")
              sushiBar = sushiBarContract.connect(deployer)

              await sushiToken.mint(deployer.address, 100)
              await sushiToken.mint(bob.address, 100)
              await sushiToken.mint(alice.address, 100)
          })
          describe("enter", function () {
              it("should not allow enter if not enough approve", async function () {
                  await expect(sushiBar.enter(100)).to.be.revertedWith(
                      "ERC20: transfer amount exceeds allowance"
                  )
                  await expect(sushiBar.enter(50)).to.be.revertedWith(
                      "ERC20: transfer amount exceeds allowance"
                  )
                  await sushiToken.approve(sushiBar.address, 100)
                  await sushiBar.enter(100)
                  expect(await sushiBar.balanceOf(deployer.address)).to.equal(100)
                  expect(await sushiToken.balanceOf(sushiBar.address)).to.equal(100)
              })
              it("updates the StakeTime mapping successfully", async function () {
                  await sushiToken.approve(sushiBar.address, 100)
                  await sushiBar.enter(100)
                  const addresstostakeTime = await sushiBar.getStakeTime(deployer.address)
                  assert(addresstostakeTime != 0)
              })
          })

          describe("leave", function () {
              it("Should work with more than one participants", async function () {
                  await sushiToken.approve(sushiBar.address, 100)
                  sushi = sushiTokenContract.connect(bob)
                  await sushi.approve(sushiBar.address, 100)
                  bar = sushiBarContract.connect(bob)

                  await sushiBar.enter(20) // by deployer
                  await bar.enter(10) // by bob

                  expect(await sushiBar.balanceOf(deployer.address)).to.equal(20)
                  expect(await sushiBar.balanceOf(bob.address)).to.equal(10)
                  expect(await sushiToken.balanceOf(sushiBar.address)).to.equal(30)
              })

              it("should revert of total time passed is less than 2 days", async function () {
                  await sushiToken.approve(sushiBar.address, 100)
                  await sushiBar.enter(100)
                  await expect(sushiBar.leave()).to.be.revertedWith(
                      "Cannot Withdraw Within Two Days"
                  )
              })
              it("Should send 25% of amount to sender and 75% back to pool", async function () {
                  await sushiToken.approve(sushiBar.address, 100)
                  await sushiBar.enter(100)
                  const unlockTime = (await time.latest()) + threeDays
                  await time.increaseTo(unlockTime)
                  const initialSushiBalance = await sushiToken.balanceOf(deployer.address)
                  await sushiBar.leave()
                  const finalSushiBalance = await sushiToken.balanceOf(deployer.address)
                  const finalSushiBarBalance = await sushiToken.balanceOf(sushiBar.address)

                  expect(finalSushiBalance.sub(initialSushiBalance)).to.equal(25)
                  expect(finalSushiBarBalance).to.equal(75)
              })
              it("Should send 50% of amount to sender and 50% back to pool", async function () {
                  await sushiToken.approve(sushiBar.address, 100)
                  await sushiBar.enter(100)
                  const unlockTime = (await time.latest()) + fiveDays
                  await time.increaseTo(unlockTime)
                  const initialSushiBalance = await sushiToken.balanceOf(deployer.address)
                  await sushiBar.leave()
                  const finalSushiBalance = await sushiToken.balanceOf(deployer.address)
                  const finalSushiBarBalance = await sushiToken.balanceOf(sushiBar.address)

                  expect(finalSushiBalance.sub(initialSushiBalance)).to.equal(50)
                  expect(finalSushiBarBalance).to.equal(50)
              })
              it("Should send 75% of amount to sender and 25% back to pool", async function () {
                  await sushiToken.approve(sushiBar.address, 100)
                  await sushiBar.enter(100)
                  const unlockTime = (await time.latest()) + sevenDays
                  await time.increaseTo(unlockTime)
                  const initialSushiBalance = await sushiToken.balanceOf(deployer.address)
                  await sushiBar.leave()
                  const finalSushiBalance = await sushiToken.balanceOf(deployer.address)
                  const finalSushiBarBalance = await sushiToken.balanceOf(sushiBar.address)

                  expect(finalSushiBalance.sub(initialSushiBalance)).to.equal(75)
                  expect(finalSushiBarBalance).to.equal(25)
              })
          })
      })
