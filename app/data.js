export const MODELS = [
  {
    model: "Epoxidation",
    endpoint: "/v0/epoxidation",
    path: "epoxidation",
    info: () => (
      <>
        <p>
          Epoxides are a common reactive metabolite, often formed by cytochromes
          P450 acting on aromatic or double bonds. The specific location on a
          molecule that undergoes epoxidation is its site of epoxidation (SOE).
          This algorithm systematically and quantitatively summarizes the
          knowledge from hundreds of epoxidation reactions, identifying SOEs
          with 94.9% area under the curve accuracy and separated epoxidized and
          non-epoxidized molecules with 78.6% accuracy.
        </p>
        <p>Please cite:</p>

        <ol>
          <li>
            Hughes, T. B., Miller, G. P., Swamidass, S. J. (2015). Modeling
            Epoxidation of Drug-like Molecules with a Deep Machine Learning
            Network. ACS Central Science, 1(4), 168-180,{" "}
            <a href="https://doi.org/10.1021/acscentsci.5b00131">
              https://doi.org/10.1021/acscentsci.5b00131
            </a>
            .
          </li>
        </ol>
      </>
    ),
  },
  {
    model: "Quinonation",
    endpoint: "/v0/quinone",
    path: "quinone",

    info: () => (
      <>
        <p>
          Quinone species, including quinone-imines, quinone-methides, and
          imine-methides, are electrophilic Michael acceptors that are often
          highly reactive, and comprise over 40% of all known reactive
          metabolites. Quinone metabolites are created by cytochromes P450 and
          peroxidases. This is there first published method for predicting
          quinone formation, including one- and two-step quinone formation. On
          the atom level, we predict sites of quinone formation with an AUC
          accuracy of 97.6%, and we identify molecules that form quinones with
          88.2% AUC.
        </p>
        <p>Please cite:</p>

        <ol>
          <li>
            Hughes, T. B. and Swamidass, S. J. (2017). Deep Learning to Predict
            the Formation of Quinone Species in Drug Metabolism. Chemical
            Research in Toxicology,{" "}
            <a href="https://doi.org/10.1021/acs.chemrestox.6b00385">
              https://doi.org/10.1021/acs.chemrestox.6b00385
            </a>
            .
          </li>
        </ol>
      </>
    ),
  },
  {
    model: "Reactivity",
    endpoint: "/v0/reactivity",
    path: "reactivity",
    info: () => (
      <>
        <p>
          Despite significant investment of resources, around 40% of drug
          candidates are discontinued due to toxicity, often arising from
          reactions between electrophilic drugs or drug metabolites and
          nucleophilic biological macromolecules, like DNA and proteins. A deep
          convolution neural network tp predict both sites of reactivity (SOR)
          and molecular reativity. Cross-validated predictions predicted with
          89.8% AUC DNA SOR, and with 94.4% AUC protein SOR, separating reactive
          molecules with DNA and protein from nonreactive molecules with
          cross-validated AUCs of 78.7% and 79.8%, respectively.
        </p>
        <p>Please cite:</p>

        <ol>
          <li>
            Hughes, T. B., Miller, G. P., Swamidass, S. J. (2015). Site of
            Reactivity Models Predict Molecular Reactivity of Diverse Chemicals
            with Glutathione. Chemical Research in Toxicology, 28(4), 797-809,{" "}
            <a href="https://doi.org/10.1021/acs.chemrestox.5b00017">
              https://doi.org/10.1021/acs.chemrestox.5b00017
            </a>
            .
          </li>
          <li>
            Hughes, T. B., Dang, N. L., Miller, G. P., Swamidass, S. J. (2016).
            Modeling Reactivity to Biological Macromolecules with a Deep
            Multitask Network. ACS Central Science,{" "}
            <a href="https://doi.org/10.1021/acscentsci.6b00162">
              https://doi.org/10.1021/acscentsci.6b00162
            </a>
            .
          </li>
        </ol>
      </>
    ),
  },
  {
    model: "N-Dealkylation",
    endpoint: "/v0/ndealk",
    path: "ndealk",

    info: () => (
      <>
        <p>
          Metabolic studies usually neglect to report or investigate aldehydes,
          even though they can be toxic. It is assumed that they are efficiently
          detoxified into carboxylic acids and alcohols. Nevertheless, some
          aldehydes are reactive and escape detoxification pathways to cause
          adverse events by forming DNA and protein adducts. This model
          accurately predicted the site of N-dealkylation within metabolized
          substrates (97% top-two and 94% area under the ROC curve).
        </p>
        <p>Please cite:</p>
        <ol>
          <li>
            Computationally Assessing the Bioactivation of Drugs by
            N-Dealkylation Na Le Dang, Tyler B. Hughes, Grover P. Miller, and S.
            Joshua Swamidass. Chemical Research in Toxicology 2018 31 (2),
            68-80,{" "}
            <a href="https://doi.org/10.1021/acs.chemrestox.7b00191">
              https://doi.org/10.1021/acs.chemrestox.7b00191
            </a>
            .
          </li>
        </ol>
      </>
    ),
  },
  {
    model: "UGT Conjugation",
    endpoint: "/v0/ugt",
    path: "ugt",
    info: () => (
      <>
        <p>
          Uridine diphosphate glucuronosyltransferases (UGTs) metabolize 15% of
          FDA approved drugs. Lead optimization efforts benefit from knowing how
          candidate drugs are metabolized by UGTs. The XenoSite UGT model
          predicts sites of UGT-mediated metabolism on drug-like molecules. In
          the training data, the sites of metabolism of 2839 UGT substrates are
          identified by our method with 86% (Top-1) and 97% (Top-2) accuracy.
        </p>
        <p>Please cite:</p>
        <ol>
          <li>
            Dang, N. L, Hughes, T. B., Krishnamurthy, V., and Swamidass, S. J.
            (2016). A Simple Model Predicts UGT-Mediated Metabolism.
            Bioinformatics,{" "}
            <a href="https://doi.org/10.1093/bioinformatics/btw350">
              https://doi.org/10.1093/bioinformatics/btw350
            </a>
            .
          </li>
        </ol>
      </>
    ),
  },
];
