"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AttributesPage = void 0;
const react_1 = __importDefault(require("react"));
const react_intl_1 = require("react-intl");
const react_query_1 = require("react-query");
const react_router_dom_1 = require("react-router-dom");
function AttributesPage() {
    const user_info = (0, react_query_1.useQuery)("user_info", () => __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch("/oidc/rp/user_info");
        if (response.status !== 200)
            throw new Error();
        const data = yield response.json();
        return data;
    }));
    const navigate = (0, react_router_dom_1.useNavigate)();
    const logout = () => __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch("/oidc/rp/revocation");
        if (response.status !== 200)
            throw new Error();
        navigate("/");
    });
    return (<div className="container pt-2 p-3">
      <div className="row d-lg-flex">
        <div className="col-12">
          <div className="card-wrapper card-space">
            <div className="card card-bg no-after">
              <div className="card-body pl-lg-0">
                <div className="row h-100">
                  <div className="col-12 pl-lg-4">
                    <h4 className="text-left">
                      <react_intl_1.FormattedMessage id="oidc-attributes"/>
                    </h4>

                    <dl>
                      {user_info.data &&
            Object.entries(user_info.data).map(([attribute, value]) => {
                return (<react_1.default.Fragment key={attribute}>
                                <dt>{attribute}:</dt>
                                <dd>{String(value)}</dd>
                              </react_1.default.Fragment>);
            })}
                    </dl>
                    <button onClick={logout} className="btn btn-secondary">
                      <react_intl_1.FormattedMessage id="oidc-logout"/>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
exports.AttributesPage = AttributesPage;
//# sourceMappingURL=AttributesPage.js.map