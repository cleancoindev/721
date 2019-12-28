import { Spec } from '@specron/spec';

/**
 * Spec context interfaces.
 */

interface Data {
  nfToken?: any;
  owner?: string;
  bob?: string;
  jane?: string;
  sara?: string;
  zeroAddress?: string;
  id1?: string;
  id2?: string;
  id3?: string;
  uri1?: string;
  uri2?: string;
  uri3?: string;
}

/**
 * Spec stack instances.
 */

const spec = new Spec<Data>();

export default spec;

spec.beforeEach(async (ctx) => {
  const accounts = await ctx.web3.eth.getAccounts();
  ctx.set('owner', accounts[0]);
  ctx.set('bob', accounts[1]);
  ctx.set('jane', accounts[2]);
  ctx.set('sara', accounts[3]);
  ctx.set('zeroAddress', '0x0000000000000000000000000000000000000000');
});

spec.beforeEach(async (ctx) => {
  ctx.set('id1', '0');
  ctx.set('id2', '1');
  ctx.set('uri1', 'QmYoPR3Uzj8tEFmbUuekzKG5swfEtqBTCyKT6Bs47i1NVp');
  ctx.set('uri2', 'QmVo27EQ3kKrSfvfd1LbqznfsJV6h3ftE4apxPhwMLWpm1');
  ctx.set('uri3', 'QmajMmUB3rtsb51nCuoaBu5uxpQA8MeaoE6bhnT5tn7MBT');
});

spec.beforeEach(async (ctx) => {
  const accounts = await ctx.web3.eth.getAccounts();
  const nfToken = await ctx.deploy({ 
    src: './build/Galaxia.json',
    contract: 'Galaxia'
  });
  await nfToken.instance.methods.initialize('Galaxia','GAX').send({ from: accounts[0] })
  ctx.set('nfToken', nfToken);
});
spec.test('correctly checks all the supported interfaces', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const nftokenInterface: boolean = await nftoken.instance.methods.supportsInterface('0x80ac58cd').call();
  const nftoken165: boolean = await nftoken.instance.methods.supportsInterface('0x01ffc9a7').call();
  const nftokenNonExistingInterface: boolean = await nftoken.instance.methods.supportsInterface('0x5c5e139f').call();
  ctx.is(nftokenInterface, true);
  ctx.is(nftoken165, true);
  ctx.is(nftokenNonExistingInterface, false);
});

spec.test('correctly mints a NFT', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const uri1 = ctx.get('uri1');

  const logs = await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  ctx.not(logs.events.Transfer, undefined);
  const count: number = await nftoken.instance.methods.balanceOf(bob).call();
  ctx.is(count.toString(), '1');
});

spec.test('returns correct balanceOf', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const id1 = ctx.get('id1');
  const id2 = ctx.get('id2');
  const uri1 = ctx.get('uri1');

  let count = await nftoken.instance.methods.balanceOf(bob).call();
  ctx.is(count.toString(), '0');

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  count = await nftoken.instance.methods.balanceOf(bob).call();
  ctx.is(count.toString(), '1');

  await nftoken.instance.methods.mint(bob, id2).send({ from: owner });
  count = await nftoken.instance.methods.balanceOf(bob).call();
  ctx.is(count.toString(), '2');
});

spec.test('throws when trying to get count of NFTs owned by 0x0 address', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const zeroAddress = ctx.get('zeroAddress');

  await ctx.reverts(() => nftoken.instance.methods.balanceOf(zeroAddress).call());
});

spec.test('mint 2 NFTs with the same uri', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const uri1 = ctx.get('uri1');
  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
});

spec.test('throws when trying to mint NFT to 0x0 address', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const zeroAddress = ctx.get('zeroAddress');
  const uri1 = ctx.get('uri1');
  await ctx.reverts(() => nftoken.instance.methods.mint(zeroAddress, uri1).send({ from: owner }));
});

spec.test('finds the correct owner of NFToken id', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const id1 = ctx.get('id1');
  const uri1 = ctx.get('uri1');

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  const id1Owner: string = await nftoken.instance.methods.ownerOf(id1).call();
  ctx.is(id1Owner, bob);
});

spec.test('throws when trying to find owner od non-existing NFT id', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const id1 = ctx.get('id1');

  await ctx.reverts(() => nftoken.instance.methods.ownerOf(id1).call());
});

spec.test('correctly approves account', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const sara = ctx.get('sara');
  const id1 = ctx.get('id1');
  const uri1 = ctx.get('uri1');

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  const logs = await nftoken.instance.methods.approve(sara, id1).send({ from: bob });
  ctx.not(logs.events.Approval, undefined);
  
  const address = await nftoken.instance.methods.getApproved(id1).call();;
  ctx.is(address, sara);
});

spec.test('correctly cancels approval', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const sara = ctx.get('sara');
  const id1 = ctx.get('id1');
  const uri1 = ctx.get('uri1');
  const zeroAddress = ctx.get('zeroAddress');

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  await nftoken.instance.methods.approve(sara, id1).send({ from: bob });
  await nftoken.instance.methods.approve(zeroAddress, id1).send({ from: bob });
  
  const address = await nftoken.instance.methods.getApproved(id1).call();
  ctx.is(address, zeroAddress);
});

spec.test('throws when trying to get approval of non-existing NFT id', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const id1 = ctx.get('id1');
  
  await ctx.reverts(() => nftoken.instance.methods.getApproved(id1).call());
});

spec.test('throws when trying to approve NFT ID from a third party', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const sara = ctx.get('sara');
  const id1 = ctx.get('id1');
  const uri1 = ctx.get('uri1');

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  await ctx.reverts(() => nftoken.instance.methods.approve(sara, id1).send({ from: sara }));
});

spec.test('correctly sets an operator', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const sara = ctx.get('sara');
  const id1 = ctx.get('id1');
  const uri1 = ctx.get('uri1');

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  const logs = await nftoken.instance.methods.setApprovalForAll(sara, true).send({ from: bob });
  ctx.not(logs.events.ApprovalForAll, undefined);
  ctx.is(nftoken.instance.methods.isApprovedForAll(bob, sara).call(), true);
});

spec.test('correctly sets then cancels an operator', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const sara = ctx.get('sara');
  const id1 = ctx.get('id1');
  const uri1 = ctx.get('uri1');

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  await nftoken.instance.methods.setApprovalForAll(sara, true).send({ from: bob });
  await nftoken.instance.methods.setApprovalForAll(sara, false).send({ from: bob });
  ctx.is(nftoken.instance.methods.isApprovedForAll(bob, sara).call(), false);

});

spec.test('corectly transfers NFT from owner', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const sara = ctx.get('sara');
  const id1 = ctx.get('id1');
  const uri1 = ctx.get('uri1');

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  const logs = await nftoken.instance.methods.transferFrom(bob, sara, id1).send({ from: bob });
  ctx.not(logs.events.Transfer, undefined);

  const bobBalance: string = await nftoken.instance.methods.balanceOf(bob).call();
  const saraBalance: string = await nftoken.instance.methods.balanceOf(sara).call();
  const ownerOfId1: string =  await nftoken.instance.methods.ownerOf(id1).call();

  ctx.is(bobBalance, '0');
  ctx.is(saraBalance, '1');
  ctx.is(ownerOfId1, sara);
});

spec.test('corectly transfers NFT from approved address', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const sara = ctx.get('sara');
  const jane = ctx.get('jane');
  const id1 = ctx.get('id1');
  const uri1 = ctx.get('uri1');

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  await nftoken.instance.methods.approve(sara, id1).send({ from: bob });
  await nftoken.instance.methods.transferFrom(bob, jane, id1).send({ from: sara });

  const bobBalance = await nftoken.instance.methods.balanceOf(bob).call();
  const janeBalance = await nftoken.instance.methods.balanceOf(jane).call();
  const ownerOfId1 =  await nftoken.instance.methods.ownerOf(id1).call();

  ctx.is(bobBalance, '0');
  ctx.is(janeBalance, '1');
  ctx.is(ownerOfId1, jane);
});

spec.test('corectly transfers NFT as operator', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const sara = ctx.get('sara');
  const jane = ctx.get('jane');
  const id1 = ctx.get('id1');
  const uri1 = ctx.get('uri1');

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  await nftoken.instance.methods.setApprovalForAll(sara, true).send({ from: bob });
  await nftoken.instance.methods.transferFrom(bob, jane, id1).send({ from: sara });

  const bobBalance = await nftoken.instance.methods.balanceOf(bob).call();
  const janeBalance = await nftoken.instance.methods.balanceOf(jane).call();
  const ownerOfId1 =  await nftoken.instance.methods.ownerOf(id1).call();

  ctx.is(bobBalance, '0');
  ctx.is(janeBalance, '1');
  ctx.is(ownerOfId1, jane);
});

spec.test('throws when trying to transfer NFT as an address that is not owner, approved or operator', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const sara = ctx.get('sara');
  const jane = ctx.get('jane');
  const id1 = ctx.get('id1');
  const uri1 = ctx.get('uri1');

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  await ctx.reverts(() => nftoken.instance.methods.transferFrom(bob, jane, id1).send({ from: sara }));
});

spec.test('throws when trying to transfer NFT to a zero address', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const zeroAddress = ctx.get('zeroAddress');
  const id1 = ctx.get('id1');
  const uri1 = ctx.get('uri1');

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  await ctx.reverts(() => nftoken.instance.methods.transferFrom(bob, zeroAddress, id1).send({ from: bob }));
});

spec.test('throws when trying to transfer a invalid NFT', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const sara = ctx.get('sara');
  const id1 = ctx.get('id1');
  const id2 = ctx.get('id2');
  const uri1 = ctx.get('uri1');

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  await ctx.reverts(() => nftoken.instance.methods.transferFrom(bob, sara, id2).send({ from: bob }));
});

spec.test('corectly safe transfers NFT from owner', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const sara = ctx.get('sara');
  const id1 = ctx.get('id1');
  const uri1 = ctx.get('uri1');

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  const logs = await nftoken.instance.methods.safeTransferFrom(bob, sara, id1).send({ from: bob });
  ctx.not(logs.events.Transfer, undefined);

  const bobBalance = await nftoken.instance.methods.balanceOf(bob).call();
  const saraBalance = await nftoken.instance.methods.balanceOf(sara).call();
  const ownerOfId1 =  await nftoken.instance.methods.ownerOf(id1).call();

  ctx.is(bobBalance, '0');
  ctx.is(saraBalance, '1');
  ctx.is(ownerOfId1, sara);
});

spec.test('throws when trying to safe transfers NFT from owner to a smart contract', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const id1 = ctx.get('id1');
  const uri1 = ctx.get('uri1');

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  await ctx.reverts(() => nftoken.instance.methods.safeTransferFrom(bob, nftoken.receipt._address, id1).send({ from: bob }));
});

spec.test('corectly safe transfers NFT from owner to smart contract that can recieve NFTs', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const id1 = ctx.get('id1');
  const uri1 = ctx.get('uri1');

  const tokenReceiver = await ctx.deploy({ 
    src: './build/nf-token-receiver-test-mock.json',
    contract: 'NFTokenReceiverTestMock',
  });

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  await nftoken.instance.methods.safeTransferFrom(bob, tokenReceiver.receipt._address, id1).send({ from: bob });

  const bobBalance = await nftoken.instance.methods.balanceOf(bob).call();
  const saraBalance = await nftoken.instance.methods.balanceOf(tokenReceiver.receipt._address).call();
  const ownerOfId1 =  await nftoken.instance.methods.ownerOf(id1).call();

  ctx.is(bobBalance, '0');
  ctx.is(saraBalance, '1');
  ctx.is(ownerOfId1, tokenReceiver.receipt._address);
});

spec.test('corectly safe transfers NFT from owner to smart contract that can recieve NFTs with data', async (ctx) => {
  const nftoken = ctx.get('nfToken');
  const owner = ctx.get('owner');
  const bob = ctx.get('bob');
  const id1 = ctx.get('id1');
  const uri1 = ctx.get('uri1');

  const tokenReceiver = await ctx.deploy({ 
    src: './build/nf-token-receiver-test-mock.json',
    contract: 'NFTokenReceiverTestMock',
  });

  await nftoken.instance.methods.mint(bob, uri1).send({ from: owner });
  await nftoken.instance.methods.safeTransferFrom(bob, tokenReceiver.receipt._address, id1, '0x01').send({ from: bob });

  const bobBalance = await nftoken.instance.methods.balanceOf(bob).call();
  const saraBalance = await nftoken.instance.methods.balanceOf(tokenReceiver.receipt._address).call();
  const ownerOfId1 =  await nftoken.instance.methods.ownerOf(id1).call();

  ctx.is(bobBalance, '0');
  ctx.is(saraBalance, '1');
  ctx.is(ownerOfId1, tokenReceiver.receipt._address);
});
