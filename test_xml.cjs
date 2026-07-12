const { xml2js } = require('xml-js');

const xml = `
<ENVELOPE>
  <BODY>
    <DATA>
      <TALLYMESSAGE>
        <VOUCHER>
          <DATE>20240401</DATE>
          <NARRATION>Test Narration</NARRATION>
          <VOUCHERTYPENAME>Sales</VOUCHERTYPENAME>
          <VOUCHERNUMBER>123</VOUCHERNUMBER>
          <PARTYLEDGERNAME>ABC Corp</PARTYLEDGERNAME>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>ABC Corp</LEDGERNAME>
            <AMOUNT>-100.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
        </VOUCHER>
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

const getNum = (val) => {
  const str = getStr(val, '0');
  const num = parseFloat(str);
  return isNaN(num) ? 0 : num;
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
let items = unwrapped.ENVELOPE.BODY.DATA.TALLYMESSAGE;
console.log(JSON.stringify(items, null, 2));

const data = Array.isArray(items) ? items : [items];
data.forEach(item => {
  const voucherNode = item.VOUCHER || item;
  console.log("Voucher Node:", voucherNode);
  console.log("Parsed Date:", getStr(voucherNode.DATE));
  console.log("Parsed Party:", getStr(voucherNode.PARTYLEDGERNAME));
});

