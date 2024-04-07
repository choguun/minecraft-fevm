# minecraft-fevm

### Vision

* On-chain Minecraft-like game in which users own their assets.

### Description

* We are building a decentralized and on-chain Minecraft-like game in which users own and monetize their assets on-chain by leveraging blockchain and IPFS technology.

![GUI](/gui.png "GUI")

### How to deploy minecraft-contract

* npx hradhat deploy
* node script/world_setup.js

### How to run minecraft-web

* npm i && npm run dev

### Key Features:

1. Mint Land(ERC721) to access your land and create a token bound account(ERC6551) to store assets in land nft.
2. Save and Load game data on-chain and decentralize with FEVM and IPFS(lighthouse.storage).
3. Gamification features eg. daily check-in and in-game token reward from quests.
4. In-game items(ERC1155) for accrue value of Land.

### Technologies Used:

* Smart Contract on FEVM
* IPFS Storage by lighthouse.storage
* Web-based game by WebGL

### How it works:
![How it works](/howitwork.png "How it works")

Demo:
https://www.voxelverses.xyz \
Video:
https://www.canva.com/design/DAGBnNV4YGE/m6tZhPHNpbgsZZWye5zcZw/edit \
Deck:
https://www.canva.com/design/DAGBnNV4YGE/m6tZhPHNpbgsZZWye5zcZw/edit

### Roadmaps
1. Sell in-game items
2. Marketplace
3. Leaderboard
4. More quests
5. Mobs and more game mechanics
6. Token Bound Account for Land NFT(inventory) to store in-game items(ERC1155) for accrue value of Land.

### Business Model
1. Sell Land and in-game items
2. Platform fees

### Deployed Smart Contract
<b>World Contract</b> https://calibration.filscan.io/en/address/0x16BBb4094d0c30F46Df8be103413da8fe96ad387 \
<b>Land Contract</b> https://calibration.filscan.io/en/address/0x57dFCd3BA1f45Aba4dEe9cC91Dcc5B55C0D5b619 \
<b>Token Contract</b> https://calibration.filscan.io/en/address/0xdb5ED0F1de2aDA99F90944e997731a2629Cd9e98 \
<b>Item Contract</b> https://calibration.filscan.io/en/address/0xC04ee655a7DD5c47d57DD78a40C5461878548D91