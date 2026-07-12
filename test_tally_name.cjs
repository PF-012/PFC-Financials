const { xml2js } = require('xml-js');

const xml = `
<ENVELOPE>
  <BODY>
    <DATA>
      <TALLYMESSAGE>
        <LEDGER>
          <NAME.LIST>
            <NAME>Test Ledger</NAME>
            <NAME>Alias Ledger</NAME>
          </NAME.LIST>
          <PARENT>Capital Account</PARENT>
        </LEDGER>
      </TALLYMESSAGE>
    </DATA>
  </BODY>
</ENVELOPE>
`;

const getStr = (val, defaultVal = '') => {
  if (val === null || val === undefined) return defaultVal;
  if (typeof val === 'string') return val;
  if (typeof val === 'number' || typeof val === 'boolean') return String(val);
  if (typeof val === 'object') {
    if (val._text !== undefined) return getStr(val._text, defaultVal);
    if (Array.isArray(val)) {
      if (val.length === 0) return defaultVal;
      if (val.length === 1) return getStr(val[0], defaultVal);
      return val.map(v => getStr(v, '')).filter(Boolean).join(', ');
    }
    return defaultVal;
  }
  return defaultVal;
};

const unwrapXml = (obj) => {
  if (Array.isArray(obj)) return obj.map(unwrapXml);
  if (obj !== null && typeof obj === 'object') {
    if (Object.keys(obj).length === 1 && obj._text !== undefined) {
      return obj._text;
    }
    const newObj = {};
    for (const key in obj) {
      if (key === '_attributes') {
        const attrs = unwrapXml(obj[key]);
        for (const attrKey in attrs) {
          newObj[attrKey] = attrs[attrKey];
        }
      } else {
        newObj[key] = unwrapXml(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

const parsed = xml2js(xml, { compact: true, nativeType: true });
const unwrapped = unwrapXml(parsed);
const items = unwrapped.ENVELOPE.BODY.DATA.TALLYMESSAGE;
const ledgerNode = items.LEDGER || items;

// The import logic uses:
const name = getStr(ledgerNode.NAME || ledgerNode.name || ledgerNode.Name || ledgerNode['Ledger Name']);
console.log("Extracted Name:", name);
console.log("Ledger Node keys:", Object.keys(ledgerNode));

