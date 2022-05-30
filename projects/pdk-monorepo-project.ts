import { NxMonorepoProject, TargetDependencyProject } from "../packages/nx-monorepo/src";
import { NodeProject } from "projen/lib/javascript";
import { Project } from "projen";

/**
 * Contains configuration for the PDK monorepo (root package).
 */
export class PDKMonorepoProject extends NxMonorepoProject {
    constructor() {
        super({
            defaultReleaseBranch: "mainline",
            eslint: false,
            name: "aws-prototyping-sdk-monorepo",
            devDeps: [
              "nx",
              "@nrwl/devkit",
              "@aws-prototyping-sdk/nx-monorepo@0.0.0",
              "@aws-prototyping-sdk/pipeline@0.0.0",
              "@commitlint/cli",
              "@commitlint/config-conventional",
              "cz-conventional-changelog",
              "fast-xml-parser",
              "husky",
            ],
            nxConfig: {
              targetDependencies: {
                upgrade: [
                  {
                    target: "upgrade",
                    projects: TargetDependencyProject.DEPENDENCIES
                  }
                ]
              },
            },
            workspaceConfig: {
              noHoist: [
                "aws-prototyping-sdk/aws-cdk-lib",
                "aws-prototyping-sdk/aws-cdk-lib/*",
                "aws-prototyping-sdk/projen",
                "aws-prototyping-sdk/projen/*",
                "aws-prototyping-sdk/@nrwl/devkit",
                "aws-prototyping-sdk/@nrwl/devkit/*",
                "aws-prototyping-sdk/constructs",
                "aws-prototyping-sdk/constructs/*",
                "aws-prototyping-sdk/license-checker",
                "aws-prototyping-sdk/license-checker/*",
                "aws-prototyping-sdk/oss-attribution-generator",
                "aws-prototyping-sdk/oss-attribution-generator/*",
                "@aws-prototyping-sdk/*/aws-cdk-lib",
                "@aws-prototyping-sdk/*/aws-cdk-lib/*",
                "@aws-prototyping-sdk/*/projen",
                "@aws-prototyping-sdk/*/projen/*",
                "@aws-prototyping-sdk/*/constructs",
                "@aws-prototyping-sdk/*/constructs/*",
                "@aws-prototyping-sdk/*/license-checker",
                "@aws-prototyping-sdk/*/license-checker/*",
                "@aws-prototyping-sdk/*/oss-attribution-generator",
                "@aws-prototyping-sdk/*/oss-attribution-generator/*",
              ]
            }
          });

          this.addTask("prepare", {
            exec: "husky install",
          });
        
          const gitSecretsScanTask = this.addTask("git-secrets-scan", {
            exec: "./scripts/git-secrets-scan.sh",
          });
        
          // Commit lint and commitizen settings
          this.addFields({
            config: {
              commitizen: {
                path: "./node_modules/cz-conventional-changelog",
              },
            },
            commitlint: {
              extends: ["@commitlint/config-conventional"],
            },
          });
        
          // Update .gitignore
          this.gitignore.exclude(
              "/.tools/",
              "/.idea/",
              ".tmp",
              "LICENSE-THIRD-PARTY",
              ".DS_Store",
              "build",
              ".env",
              "tsconfig.tsbuildinfo"
          );
        
          resolveDependencies(this);
        
          this.testTask.spawn(gitSecretsScanTask);
        
          const upgradeDepsTask = this.addTask("upgrade-deps");
          upgradeDepsTask.exec("npx nx run-many --target=upgrade-deps --all --parallel=1");
          upgradeDepsTask.exec("npx projen upgrade");
          upgradeDepsTask.exec("npx projen");
    }

    /**
     * @inheritDoc
     */
    preSynthesize() {
        super.preSynthesize();
        
        this.subProjects.forEach((subProject) => {
            // Resolve any problematic dependencies
            resolveDependencies(subProject);

            // Add upgrade-deps task to subprojects
            configureUpgradeDependenciesTask(subProject);
        });
    }
}

/**
 * Adds an 'upgrade-deps' delegate task if an 'upgrade' task is found. This is needed as there are
 * issues with NX and tasks named 'upgrade'.
 * 
 * @param project Project instance to configure.
 */
const configureUpgradeDependenciesTask = (project: Project): void => {
  const upgradeTask = project.tasks.tryFind("upgrade");
  upgradeTask && project.addTask("upgrade-deps").spawn(upgradeTask);
}

/**
 * Resolves dependencies for projects of type NodeProject.
 * 
 * @param project Project instance to configure.
 */
const resolveDependencies = (project: any): void => {
    // resolutions
    if (project instanceof NodeProject || project.package) {
      project.addFields({
        resolutions: {
          "@types/prettier": "2.6.0",
          "ansi-regex": "^5.0.1",
          underscore: "^1.12.1",
          "deep-extend": "^0.5.1",
          debug: "^2.6.9",
          "minimist": "^1.2.6",
          "ejs": "^3.1.7",
          "async": "^2.6.4"
        },
      });
    }
  };