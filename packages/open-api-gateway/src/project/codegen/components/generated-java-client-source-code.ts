/*********************************************************************************************************************
 Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.

 Licensed under the Apache License, Version 2.0 (the "License").
 You may not use this file except in compliance with the License.
 You may obtain a copy of the License at

 http://www.apache.org/licenses/LICENSE-2.0

 Unless required by applicable law or agreed to in writing, software
 distributed under the License is distributed on an "AS IS" BASIS,
 WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 See the License for the specific language governing permissions and
 limitations under the License.
 ******************************************************************************************************************** */

import { getLogger } from "log4js";
import { Component } from "projen";
import { JavaProject } from "projen/lib/java";
import { ClientLanguage } from "../../languages";
import { invokeOpenApiGenerator } from "./utils";

const logger = getLogger();

/**
 * Configuration for the GeneratedJavaClient component
 */
export interface GeneratedJavaClientSourceCodeOptions {
  /**
   * Absolute path to the OpenAPI specification (spec.yaml)
   */
  readonly specPath: string;

  /**
   * Control if generator needs to be invoked
   */
  readonly invokeGenerator: boolean;
}

/**
 * Generates the java client using OpenAPI Generator
 */
export class GeneratedJavaClientSourceCode extends Component {
  private options: GeneratedJavaClientSourceCodeOptions;

  constructor(
    project: JavaProject,
    options: GeneratedJavaClientSourceCodeOptions
  ) {
    super(project);
    this.options = options;
  }

  /**
   * @inheritDoc
   */
  synthesize() {
    super.synthesize();

    if (this.options.invokeGenerator) {
      const javaProject = this.project as JavaProject;
      const invokerPackage = `${javaProject.pom.groupId}.${javaProject.name}.client`;

      // Generate the java client
      logger.debug("Generating java client...");
      invokeOpenApiGenerator({
        generator: "java",
        specPath: this.options.specPath,
        outputPath: this.project.outdir,
        generatorDirectory: ClientLanguage.JAVA,
        additionalProperties: {
          useSingleRequestParameter: "true",
          groupId: javaProject.pom.groupId,
          artifactId: javaProject.pom.artifactId,
          artifactVersion: javaProject.pom.version,
          invokerPackage,
          apiPackage: `${invokerPackage}.api`,
          modelPackage: `${invokerPackage}.model`,
          hideGenerationTimestamp: "true",
          additionalModelTypeAnnotations: [
            "@lombok.AllArgsConstructor",
            // Regular lombok builder is not used since an abstract base schema class is also annotated
            "@lombok.experimental.SuperBuilder",
          ].join("\\ "),
        },
      });
    }
  }
}
