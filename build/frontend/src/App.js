"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const react_1 = __importDefault(require("react"));
const react_intl_1 = require("react-intl");
const react_query_1 = require("react-query");
const react_router_dom_1 = require("react-router-dom");
const Footer_1 = require("./components/Footer");
const Header_1 = require("./components/Header");
const translations_1 = require("./components/translations");
const AttributesPage_1 = require("./pages/AttributesPage");
const ErrorPage_1 = require("./pages/ErrorPage");
const LandingPage_1 = require("./pages/LandingPage");
const queryClient = new react_query_1.QueryClient();
function App() {
    return (<react_query_1.QueryClientProvider client={queryClient}>
      <react_intl_1.IntlProvider locale={navigator.language} messages={translations_1.translations[navigator.language]}>
        <react_router_dom_1.BrowserRouter>
          <Header_1.Header />
          <react_router_dom_1.Routes>
            <react_router_dom_1.Route path="/" element={<LandingPage_1.LandingPage />}/>
            <react_router_dom_1.Route path="error" element={<ErrorPage_1.ErrorPage />}/>
            <react_router_dom_1.Route path="attributes" element={<AttributesPage_1.AttributesPage />}/>
          </react_router_dom_1.Routes>
          <Footer_1.Footer />
        </react_router_dom_1.BrowserRouter>
      </react_intl_1.IntlProvider>
    </react_query_1.QueryClientProvider>);
}
exports.default = App;
//# sourceMappingURL=App.js.map