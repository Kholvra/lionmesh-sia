/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "core-no-modules",
      severity: "error",
      comment:
        "ARCH-02: src/core adalah fondasi bersama dan tidak boleh bergantung pada modul siklus.",
      from: { path: "^src/core/" },
      to: { path: "^src/modules/" },
    },
    {
      name: "no-cross-module",
      severity: "error",
      comment:
        "ARCH-01: modul siklus tidak boleh mengimpor modul siklus lain. Gunakan service di src/core.",
      from: { path: "^src/modules/([^/]+)/" },
      to: { path: "^src/modules/", pathNot: "^src/modules/$1/" },
    },
    {
      name: "no-circular",
      severity: "warn",
      comment: "Ketergantungan melingkar menyulitkan pemisahan modul.",
      from: {},
      to: { circular: true },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    exclude: { path: "\\.next/" },
    tsConfig: { fileName: "tsconfig.json" },
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default"],
    },
    reporterOptions: {
      dot: { collapsePattern: "node_modules/(?:@[^/]+/[^/]+|[^/]+)" },
    },
  },
};
