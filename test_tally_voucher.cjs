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
            <ISDEEMEDPOSITIVE>Yes</ISDEEMEDPOSITIVE>
            <AMOUNT>-1180.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>Sales Account</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>1000.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>Output CGST 9%</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>90.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
          <ALLLEDGERENTRIES.LIST>
            <LEDGERNAME>Output SGST 9%</LEDGERNAME>
            <ISDEEMEDPOSITIVE>No</ISDEEMEDPOSITIVE>
            <AMOUNT>90.00</AMOUNT>
          </ALLLEDGERENTRIES.LIST>
        </VOUCHER>
      </TALLYMESSAGE>
    </DATA>
  </BODY>
</ENVELOPE>
`;

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
const voucherNode = items.VOUCHER;
console.log(JSON.stringify(voucherNode, null, 2));
