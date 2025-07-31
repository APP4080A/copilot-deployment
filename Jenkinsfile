pipeline {
    agent any
    tools {
        nodejs 'NodeJS' // Ensure NodeJS is configured in Jenkins
    }

    environment {
        CI = 'true'
    }

    stages {
        stage('Checkout') {
            steps {
                git branch: 'main', 
                    url: 'https://github.com/APP4080A/copilot-core.git',
                    credentialsId: 'github-password' // Prefer GitHub token
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Frontend Install') {
                    steps {
                        dir('frontend') {
                            bat 'npm install'
                        }
                    }
                }
                stage('Backend Install') {
                    steps {
                        dir('backend') {
                            bat 'npm install'
                        }
                    }
                }
            }
        }

        stage('Test') {
            parallel {
                stage('Frontend Tests') {
                    steps {
                        dir('frontend') {
                            bat 'set CI=true && npm test'
                        }
                    }
                }
                stage('Backend Tests') {
                    steps {
                        dir('backend') {
                            bat 'npm test'
                        }
                    }
                }
            }
        }

        stage('Build') {
            parallel {
                stage('Frontend Build') {
                    steps {
                        dir('frontend') {
                            bat 'npm run build'
                        }
                    }
                }
               // stage('Backend Build') {
                  //  steps {
                    //    dir('backend') {
                     //       bat 'npm run build'
                     //   }
                  //  }
               // }
            }
        }

        stage('Simulate Deploy') {
            steps {
                echo 'Skipping backend server startup in CI environment.'
            }
        }
    }

    post {
        always {
            echo 'Cleaning workspace...'
            bat '''
                if exist "frontend\\node_modules" rd /s /q "frontend\\node_modules"
                if exist "backend\\node_modules" rd /s /q "backend\\node_modules"
            '''
        }
        success {
            echo 'Pipeline succeeded!'
        }
        failure {
            echo 'Pipeline failed!'
        }
    }
}
