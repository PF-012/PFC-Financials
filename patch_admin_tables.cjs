const fs = require('fs');
let content = fs.readFileSync('src/pages/Admin.tsx', 'utf8');

const tableReqStr = `<table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">`;

const tableReqRep = `{React.useMemo(() => (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">`;

const tableReqEnd = `                )}
              </tbody>
            </table>
          ) : (`;

const tableReqEndRep = `                )}
              </tbody>
            </table>
          ), [filteredRequests])}
          ) : (`;

const tableCompStr = `<table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>`;

const tableCompRep = `{React.useMemo(() => (
            <table className="w-full text-left">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-3 text-xs font-medium text-gray-500 uppercase tracking-wider">Company</th>`;

const tableCompEnd = `                )}
              </tbody>
            </table>
          )}`;

const tableCompEndRep = `                )}
              </tbody>
            </table>
          ), [filteredCompanies])}`;

content = content.replace(tableReqStr, tableReqRep).replace(tableReqEnd, tableReqEndRep)
               .replace(tableCompStr, tableCompRep).replace(tableCompEnd, tableCompEndRep);

fs.writeFileSync('src/pages/Admin.tsx', content);
console.log("Patched Admin tables");
