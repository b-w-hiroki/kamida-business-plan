const {test}=require('node:test'); const assert=require('node:assert/strict');
const {compareScenarios}=require('../scenarios');
test('standard matches base, fixed and initial costs preserved',()=>{
 const rows=[{units:10,income:1000,cost:800},{units:20,income:2000,cost:500}];
 const before=JSON.stringify(rows); const result=compareScenarios(rows);
 assert.deepEqual(result.map(r=>r.profit),[1100,1700,2300]); assert.equal(JSON.stringify(rows),before);
});
test('zero volume and negative profit remain finite',()=>{
 assert.deepEqual(compareScenarios([{units:0,income:0,cost:100}]).map(r=>r.profit),[-100,-100,-100]);
});
test('invalid plans rejected',()=>assert.throws(()=>compareScenarios([{units:NaN,income:1,cost:1}])));
