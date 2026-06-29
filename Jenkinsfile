pipeline {
    agent any

    environment {
        DOCKER_IMAGE_BACKEND = 'civiclens-backend'
        DOCKER_IMAGE_FRONTEND = 'civiclens-frontend'
        BACKEND_HEALTH_URL = 'http://localhost:9526/actuator/health'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Backend Build') {
            steps {
                dir('backend') {
                    sh 'mvn clean package -DskipTests'
                }
            }
        }

        stage('Frontend Build') {
            steps {
                dir('frontend') {
                    sh 'npm install'
                    sh 'npm run build'
                }
            }
        }

        stage('Backup Running Images') {
            steps {
                script {
                    echo 'Tagging current running images as rollback backups...'
                    sh 'docker tag ${DOCKER_IMAGE_BACKEND}:stable ${DOCKER_IMAGE_BACKEND}:rollback || true'
                    sh 'docker tag ${DOCKER_IMAGE_FRONTEND}:stable ${DOCKER_IMAGE_FRONTEND}:rollback || true'
                }
            }
        }

        stage('Backend Docker Build') {
            steps {
                dir('backend') {
                    sh 'docker build -t ${DOCKER_IMAGE_BACKEND}:stable .'
                }
            }
        }

        stage('Frontend Docker Build') {
            steps {
                dir('frontend') {
                    sh 'docker build -t ${DOCKER_IMAGE_FRONTEND}:stable .'
                }
            }
        }

        stage('Deploy Docker Compose') {
            steps {
                sh 'docker compose down --remove-orphans || true'
                sh 'docker compose up -d'
            }
        }

        stage('Health Check') {
            steps {
                script {
                    echo 'Polling backend health endpoint inside civiclens-backend container...'
                    int maxRetries = 12
                    int retries = 0
                    boolean healthy = false
                    while (retries < maxRetries && !healthy) {
                        sleep time: 10, unit: 'SECONDS'
                        try {
                            def response = sh(script: "docker exec civiclens-backend wget -qO- http://localhost:9526/actuator/health", returnStdout: true).trim()
                            if (response.contains('"status":"UP"') || response.contains('"status" : "UP"')) {
                                healthy = true
                                echo 'Deployment healthy! Actuator reported status UP.'
                            } else {
                                echo "Backend response: ${response}. Retrying..."
                            }
                        } catch (Exception e) {
                            echo "Health check inside container failed: ${e.message}. Retrying..."
                        }
                        retries++
                    }
                    if (!healthy) {
                        echo '=== HEALTH CHECK FAILED: Printing container logs ==='
                        sh 'docker logs civiclens-backend --tail=200'
                        error 'Backend failed to pass actuator health check. Aborting deployment!'
                    }
                }
            }
        }

        stage('Cleanup') {
            steps {
                echo 'Cleaning up unused Docker resource cache...'
                sh 'docker image prune -f'
            }
        }
    }

    post {
        failure {
            script {
                echo '=== DEPLOYMENT FAILED: Rolling back to previous stable containers ==='
                try {
                    sh 'docker tag ${DOCKER_IMAGE_BACKEND}:rollback ${DOCKER_IMAGE_BACKEND}:stable'
                    sh 'docker tag ${DOCKER_IMAGE_FRONTEND}:rollback ${DOCKER_IMAGE_FRONTEND}:stable'
                    sh 'docker compose down || true'
                    sh 'docker compose up -d'
                    echo 'Rollback completed successfully.'
                } catch (Exception e) {
                    echo "Rollback aborted or failed: ${e.message}"
                }
            }
        }
    }
}
