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
exports.LandingPage = void 0;
const react_1 = __importDefault(require("react"));
require("../components/access-button.css");
const spid_ico_circle_bb_svg_1 = __importDefault(require("../components/spid-ico-circle-bb.svg"));
const cie_ico_circle_bb_svg_1 = __importDefault(require("../components/cie-ico-circle-bb.svg"));
const spid_logo_svg_1 = __importDefault(require("../components/spid-logo.svg"));
const react_query_1 = require("react-query");
const react_intl_1 = require("react-intl");
function LandingPage() {
    var _a, _b, _c, _d;
    const providers = (0, react_query_1.useQuery)("providers", () => __awaiter(this, void 0, void 0, function* () {
        const response = yield fetch("/oidc/rp/providers");
        if (response.status !== 200)
            throw new Error();
        return (yield response.json());
    }));
    const [isSpidButtonOpen, setIsSpidButtonOpen] = react_1.default.useState(false);
    const [isCieButtonOpen, setIsCieButtonOpen] = react_1.default.useState(false);
    return (<div className="container pt-2 p-3">
      <div className="row d-lg-flex">
        <div className="col-12">
          <div className="card-wrapper card-space">
            <div className="card card-bg no-after">
              <div className="card-body pl-lg-0">
                <div className="row h-100">
                  <div className="col-12 pl-lg-4">
                    <div className="row p-3">
                      <h3 className="text-left">
                        <react_intl_1.FormattedMessage id="welcome"/>
                      </h3>
                      <p className="card-title">
                        <react_intl_1.FormattedMessage id="spid-explanation"/>
                      </p>
                      <p className="card-title">
                        <react_intl_1.FormattedMessage id="cie-explanation"/>
                      </p>
                    </div>
                    <div className="row mt-3">
                      <div className="col">
                        <span className="badge badge-grey-unical square-corners mb-3 mr-2 ml-0 pr-10 p-2 mw-100">
                          <button id="spid-idp" type="button" className="italia-it-button italia-it-button-size-m button-spid" aria-expanded={isSpidButtonOpen} aria-haspopup="menu" aria-controls="spid-idp-list-medium-root-get" onClick={() => setIsSpidButtonOpen(!isSpidButtonOpen)}>
                            <span className="italia-it-button-icon">
                              <img src={spid_ico_circle_bb_svg_1.default} alt=""/>
                            </span>
                            <span className="italia-it-button-text">
                              <react_intl_1.FormattedMessage id="login-with-spid"/>
                            </span>
                          </button>

                          <div id="spid-idp-button-medium-get" className="spid-idp-button spid-idp-button-tip spid-idp-button-relative" style={{
            display: isSpidButtonOpen ? "block" : "none",
        }}>
                            <ul id="spid-idp-list-medium-root-get" role="menu" className="spid-idp-button-menu" aria-orientation="vertical" aria-labelledby="spid-idp" style={{
            display: isSpidButtonOpen ? "block" : "none",
        }}>
                              {(_b = (_a = providers.data) === null || _a === void 0 ? void 0 : _a.spid) === null || _b === void 0 ? void 0 : _b.map((provider) => {
            var _a;
            return (<li key={provider.sub} role="presentation" className="spid-idp-button-link">
                                    <a role="menuitem" href={`/oidc/rp/authorization?${new URLSearchParams({ provider: provider.sub })}`}>
                                      <span className="spid-sr-only">
                                        {provider.organization_name}
                                      </span>
                                      <img src={(_a = provider.logo_uri) !== null && _a !== void 0 ? _a : spid_logo_svg_1.default} alt=""/>
                                    </a>
                                  </li>);
        })}
                            </ul>
                          </div>
                        </span>
                        <span className="badge badge-grey-unical square-corners mb-3 mr-2 ml-0 pr-10 p-2 mw-100">
                          <button id="cie-idp" type="button" className="italia-it-button italia-it-button-size-m button-cie" aria-expanded={isCieButtonOpen} aria-haspopup="menu" aria-controls="cie-idp-list-medium-root-get" onClick={() => setIsCieButtonOpen(!isCieButtonOpen)}>
                            <span className="italia-it-button-icon">
                              <img src={cie_ico_circle_bb_svg_1.default} alt=""/>
                            </span>
                            <span className="italia-it-button-text">
                              <react_intl_1.FormattedMessage id="login-with-cie"/>
                            </span>
                          </button>

                          <div id="cie-idp-button-medium-get" className="cie-idp-button cie-idp-button-tip cie-idp-button-relative" style={{
            display: isCieButtonOpen ? "block" : "none",
        }}>
                            <ul id="cie-idp-list-medium-root-get" role="menu" className="cie-idp-button-menu" aria-orientation="vertical" aria-labelledby="cie-idp" style={{
            display: isCieButtonOpen ? "block" : "none",
        }}>
                              {(_d = (_c = providers.data) === null || _c === void 0 ? void 0 : _c.cie) === null || _d === void 0 ? void 0 : _d.map((provider) => {
            var _a;
            return (<li key={provider.sub} role="presentation" className="cie-idp-button-link">
                                    <a role="menuitem" href={`/oidc/rp/authorization?${new URLSearchParams({ provider: provider.sub })}`}>
                                      <span className="cie-sr-only">
                                        {provider.organization_name}
                                      </span>
                                      <img src={(_a = provider.logo_uri) !== null && _a !== void 0 ? _a : spid_logo_svg_1.default} alt=""/>
                                    </a>
                                  </li>);
        })}
                            </ul>
                          </div>
                        </span>
                      </div>
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
exports.LandingPage = LandingPage;
//# sourceMappingURL=LandingPage.js.map