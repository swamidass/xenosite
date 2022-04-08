const {test} = require(`zora`);
const memoize = require(`lodash/memoize.js`);

let callCount = 0;

const wait = (time = 200) => new Promise((resolve) => {
    setTimeout(() => resolve(), time);
});

const fetchRemoteResource = memoize(async () => {
    callCount++;
    await wait();
    return 'whatever';
});

test(`should only be called once`, async t => {
    const res1 = await fetchRemoteResource();
    const res2 = await fetchRemoteResource();
    
    t.eq(res1, 'whatever');
    t.eq(res2, 'whatever');
    t.eq(callCount, 1);
});
