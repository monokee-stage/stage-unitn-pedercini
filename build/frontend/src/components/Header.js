"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Header = void 0;
const react_1 = __importDefault(require("react"));
const react_intl_1 = require("react-intl");
const sprite_svg_1 = __importDefault(require("./sprite.svg"));
function Header() {
    return (<div className="it-header-wrapper">
      <div className="it-header-slim-wrapper">
        <div className="container">
          <div className="row">
            <div className="col-12">
              <div className="it-header-slim-wrapper-content">
                <a className="d-none d-lg-block navbar-brand" href="https://www.spid.gov.it/">
                  <react_intl_1.FormattedMessage id="title"/>
                </a>
                <div className="nav-mobile">
                  <nav>
                    <a className="it-opener d-lg-none" data-toggle="collapse" href="#menu-principale" role="button" aria-expanded="false" aria-controls="menu-principale">
                      <span>
                        <react_intl_1.FormattedMessage id="title"/>
                      </span>
                      <svg className="icon">
                        <use xlinkHref={sprite_svg_1.default + "#it-expand"}></use>
                      </svg>
                    </a>
                    <div className="link-list-wrapper collapse" id="menu-principale">
                      <ul className="link-list">
                        <li>
                          <a href="#">Link 1</a>
                        </li>
                        <li>
                          <a href="#">Link 2 Active</a>
                        </li>
                      </ul>
                    </div>
                  </nav>
                </div>
                <div className="header-slim-right-zone">
                  <div className="nav-item dropdown">
                    <a className="nav-link dropdown-toggle" href="#" data-toggle="dropdown" aria-expanded="false">
                      <span>ITA</span>
                      <svg className="icon d-none d-lg-block">
                        <use xlinkHref={sprite_svg_1.default + "#it-expand"}></use>
                      </svg>
                    </a>
                    <div className="dropdown-menu">
                      <div className="row">
                        <div className="col-12">
                          <div className="link-list-wrapper">
                            <ul className="link-list">
                              <li>
                                <a className="list-item" href="#">
                                  <span>ITA</span>
                                </a>
                              </li>
                              <li>
                                <a className="list-item" href="#">
                                  <span>ENG</span>
                                </a>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="it-nav-wrapper">
        <div className="it-header-center-wrapper">
          <div className="container">
            <div className="row">
              <div className="col-12">
                <div className="it-header-center-content-wrapper">
                  <div className="it-brand-wrapper">
                    <a href="/">
                      <svg className="icon">
                        <use xlinkHref={sprite_svg_1.default + "#it-code-circle"}></use>
                      </svg>
                      <div className="it-brand-text">
                        <h2 className="no_toc">
                          <react_intl_1.FormattedMessage id="title"/>
                        </h2>
                        <h3 className="no_toc d-none d-md-block">
                          <react_intl_1.FormattedMessage id="title"/>
                        </h3>
                      </div>
                    </a>
                  </div>
                  <div className="it-right-zone">
                    <div className="it-socials d-none d-md-flex">
                      <span>
                        <react_intl_1.FormattedMessage id="follow-us"/>
                      </span>
                      <ul>
                        <li>
                          <a href="#" aria-label="Facebook" target="_blank">
                            <svg className="icon">
                              <use xlinkHref={sprite_svg_1.default + "#it-facebook"}></use>
                            </svg>
                          </a>
                        </li>
                        <li>
                          <a href="#" aria-label="Github" target="_blank">
                            <svg className="icon">
                              <use xlinkHref={sprite_svg_1.default + "#it-github"}></use>
                            </svg>
                          </a>
                        </li>
                        <li>
                          <a href="#" target="_blank" aria-label="Twitter">
                            <svg className="icon">
                              <use xlinkHref={sprite_svg_1.default + "#it-twitter"}></use>
                            </svg>
                          </a>
                        </li>
                      </ul>
                    </div>
                    <div className="it-search-wrapper">
                      <span className="d-none d-md-block">
                        <react_intl_1.FormattedMessage id="search"/>
                      </span>
                      <a className="search-link rounded-icon" href="#">
                        <svg className="icon">
                          <use xlinkHref={sprite_svg_1.default + "#it-search"}></use>
                        </svg>
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <div className="it-header-navbar-wrapper">
          <div className="container">
            <div className="row">
              <div className="col-12">
                <nav className="navbar navbar-expand-lg has-megamenu">
                  <button className="custom-navbar-toggler" type="button" aria-controls="nav10" aria-expanded="false" aria-label="Toggle navigation" data-target="#nav10">
                    <svg className="icon">
                      <use xlinkHref={sprite_svg_1.default + "#it-burger"}></use>
                    </svg>
                  </button>
                  <div className="navbar-collapsable" id="nav10">
                    <div className="overlay"></div>
                    <div className="close-div sr-only">
                      <button className="btn close-menu" type="button">
                        <span className="it-close"></span>close
                      </button>
                    </div>
                    <div className="menu-wrapper">
                      <ul className="navbar-nav">
                        <li className="nav-item active">
                          <a className="nav-link active" href="#">
                            <span>link 1 attivo</span>
                            <span className="sr-only">current</span>
                          </a>
                        </li>
                        <li className="nav-item">
                          <a className="nav-link" href="#">
                            <span>link 2</span>
                          </a>
                        </li>
                        <li className="nav-item">
                          <a className="nav-link disabled" href="#">
                            <span>link 3 disabilitato</span>
                          </a>
                        </li>
                        <li className="nav-item dropdown">
                          <a className="nav-link dropdown-toggle" href="#" data-toggle="dropdown" aria-expanded="false">
                            <span>Esempio di Dropdown</span>
                            <svg className="icon icon-xs">
                              <use xlinkHref={sprite_svg_1.default + "#it-expand"}></use>
                            </svg>
                          </a>
                          <div className="dropdown-menu">
                            <div className="link-list-wrapper">
                              <ul className="link-list">
                                <li>
                                  <h3 className="no_toc" id="heading">
                                    Heading
                                  </h3>
                                </li>
                                <li>
                                  <a className="list-item" href="#">
                                    <span>Link list 1</span>
                                  </a>
                                </li>
                                <li>
                                  <a className="list-item" href="#">
                                    <span>Link list 2</span>
                                  </a>
                                </li>
                                <li>
                                  <a className="list-item" href="#">
                                    <span>Link list 3</span>
                                  </a>
                                </li>
                                <li>
                                  <span className="divider"></span>
                                </li>
                                <li>
                                  <a className="list-item" href="#">
                                    <span>Link list 4</span>
                                  </a>
                                </li>
                              </ul>
                            </div>
                          </div>
                        </li>
                        <li className="nav-item dropdown megamenu">
                          <a className="nav-link dropdown-toggle" href="#" data-toggle="dropdown" aria-expanded="false">
                            <span>Esempio di Megamenu</span>
                            <svg className="icon icon-xs">
                              <use xlinkHref={sprite_svg_1.default + "#it-expand"}></use>
                            </svg>
                          </a>
                          <div className="dropdown-menu">
                            <div className="row">
                              <div className="col-12 col-lg-4">
                                <div className="link-list-wrapper">
                                  <ul className="link-list">
                                    <li>
                                      <h3 className="no_toc">Heading 1</h3>
                                    </li>
                                    <li>
                                      <a className="list-item" href="#">
                                        <span>Link list 1 </span>
                                      </a>
                                    </li>
                                    <li>
                                      <a className="list-item" href="#">
                                        <span>Link list 2 </span>
                                      </a>
                                    </li>
                                    <li>
                                      <a className="list-item" href="#">
                                        <span>Link list 3 </span>
                                      </a>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                              <div className="col-12 col-lg-4">
                                <div className="link-list-wrapper">
                                  <ul className="link-list">
                                    <li>
                                      <h3 className="no_toc">Heading 2</h3>
                                    </li>
                                    <li>
                                      <a className="list-item" href="#">
                                        <span>Link list 1 </span>
                                      </a>
                                    </li>
                                    <li>
                                      <a className="list-item" href="#">
                                        <span>Link list 2 </span>
                                      </a>
                                    </li>
                                    <li>
                                      <a className="list-item" href="#">
                                        <span>Link list 3 </span>
                                      </a>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                              <div className="col-12 col-lg-4">
                                <div className="link-list-wrapper">
                                  <ul className="link-list">
                                    <li>
                                      <h3 className="no_toc">Heading 3</h3>
                                    </li>
                                    <li>
                                      <a className="list-item" href="#">
                                        <span>Link list 1 </span>
                                      </a>
                                    </li>
                                    <li>
                                      <a className="list-item" href="#">
                                        <span>Link list 2 </span>
                                      </a>
                                    </li>
                                    <li>
                                      <a className="list-item" href="#">
                                        <span>Link list 3</span>
                                      </a>
                                    </li>
                                  </ul>
                                </div>
                              </div>
                            </div>
                          </div>
                        </li>
                      </ul>
                    </div>
                  </div>
                </nav>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>);
}
exports.Header = Header;
//# sourceMappingURL=Header.js.map