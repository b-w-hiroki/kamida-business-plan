(function(root) {
  function compareScenarios(months) {
    if (!Array.isArray(months) || months.some(m => !Number.isFinite(m.units) || !Number.isFinite(m.income) || !Number.isFinite(m.cost) || m.units < 0)) throw new TypeError('Invalid monthly plan');
    return [{name:'慎重', multiplier:0.8}, {name:'標準', multiplier:1}, {name:'楽観', multiplier:1.2}].map(s => {
      const rows = months.map(m => {
        const units = Math.round(m.units * s.multiplier);
        const income = m.units ? m.income / m.units * units : 0;
        return {units, income, profit:income - m.cost};
      });
      return {...s, income:rows.reduce((n,m)=>n+m.income,0), profit:rows.reduce((n,m)=>n+m.profit,0)};
    });
  }
  if(typeof module !== 'undefined') module.exports = {compareScenarios};
  else root.compareScenarios = compareScenarios;
})(globalThis);
