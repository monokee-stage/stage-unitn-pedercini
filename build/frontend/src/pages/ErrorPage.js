"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ErrorPage = void 0;
const react_1 = __importDefault(require("react"));
const react_intl_1 = require("react-intl");
const react_router_dom_1 = require("react-router-dom");
function ErrorPage() {
    var _a, _b;
    let [searchParams] = (0, react_router_dom_1.useSearchParams)();
    const error = (_a = searchParams.get("error")) !== null && _a !== void 0 ? _a : "";
    const error_description = (_b = searchParams.get("error_description")) !== null && _b !== void 0 ? _b : "";
    return (<div className="container pt-2 p-3">
      <div className="row d-lg-flex">
        <div className="col-12">
          <div className="card-wrapper card-space">
            <div className="card card-bg no-after">
              <div className="card-body pl-lg-0">
                <div className="row h-100">
                  <div className="col-12 col-lg-6 pl-lg-4">
                    <div className="callout danger">
                      <div className="callout-title">
                        <react_intl_1.FormattedMessage id={error}/>
                      </div>
                      <p>
                        <react_intl_1.FormattedMessage id={error_description}/>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
exports.ErrorPage = ErrorPage;
//# sourceMappingURL=ErrorPage.js.map