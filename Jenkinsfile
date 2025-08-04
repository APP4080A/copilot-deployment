pipeline {
    agent any

    tools {
        nodejs 'NodeJS' // Ensure this matches your Jenkins NodeJS tool name
    }

    environment {
        FRONTEND_DIR = 'frontend'
        BACKEND_DIR = 'backend'
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/APP4080A/copilot-core.git',
                    credentialsId: 'gitHub-pat'
            }
        }

        stage('Install Dependencies') {
            parallel {
                stage('Frontend Install') {
                    steps {
                        dir("${FRONTEND_DIR}") {
                            bat 'npm install'
                        }
                    }
                }
                stage('Backend Install') {
                    steps {
                        dir("${BACKEND_DIR}") {
                            bat 'npm install'
                        }
                    }
                }
            }
        }

        stage('Build') {
            parallel {
                stage('Frontend Build') {
                    steps {
                        dir("${FRONTEND_DIR}") {
                            bat 'npm run build'
                        }
                    }
                }
                stage('Backend Build') {
                    steps {
                        dir("${BACKEND_DIR}") {
                            bat 'echo "Backend build complete (nothing to compile)"'
                        }
                    }
                }
            }
        }

        stage('Test') {
            parallel {
                stage('Frontend Tests') {
                    steps {
                        dir("${FRONTEND_DIR}") {
                            bat 'set CI=true && npm test'
                        }
                    }
                }
                stage('Backend Tests') {
                    steps {
                        dir("${BACKEND_DIR}") {
                            bat 'npm test'
                        }
                    }
                }
            }
        }

        stage('Deploy') {
            parallel {
                stage('Deploy Frontend') {
                    steps {
                        dir("${FRONTEND_DIR}\\dist") {
                            bat 'xcopy /E /I /Y . C:\\deploy\\frontend\\'
                        }
                    }
                }
                stage('Deploy Backend') {
                    steps {
                        dir("${BACKEND_DIR}") {
                            bat '''
                                npm install -g pm2
                                pm2 restart index.js || pm2 start index.js
                            '''
                        }
                    }
                }
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
