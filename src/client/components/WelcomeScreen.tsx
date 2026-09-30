/**
 * Landing page. A hackathon demo gets opened by people who have never seen it,
 * so the first screen explains the demo and links to its source.
 */
import type { ReactElement } from "react";

import { useI18n } from "../i18n.ts";
import "./WelcomeScreen.scss";

const REPO_URL = "https://hackathon.reusser.io/carapia/IrisDCSReferrals";

export function WelcomeScreen(): ReactElement {
  const { t } = useI18n();

  return (
    <section className="welcome" aria-labelledby="welcome-title">
      <h2 id="welcome-title">{t("welcome.title")}</h2>
      <p className="welcome-lede">{t("welcome.lede")}</p>

      <a className="welcome-cta" href="#/queue">
        {t("welcome.enter")}
      </a>

      <h3>{t("welcome.tryTitle")}</h3>
      <ol className="welcome-steps">
        <li>{t("welcome.step1")}</li>
        <li>{t("welcome.step2")}</li>
        <li>{t("welcome.step3")}</li>
      </ol>

      <h3>{t("welcome.linksTitle")}</h3>
      <ul className="welcome-links">
        <li>
          <a className="welcome-link" href={REPO_URL} rel="noreferrer" target="_blank">
            <span className="welcome-link-title">{t("welcome.repo")}</span>
            <span className="welcome-link-detail">{t("welcome.repoDetail")}</span>
          </a>
        </li>
      </ul>

      <p className="welcome-note">{t("welcome.boundary")}</p>
    </section>
  );
}
