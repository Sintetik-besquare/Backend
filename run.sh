# HArd terminate if any commands failed
set -e
#cd into main_service
cd main_service;
#if not exists.....
#-d directory exist
if [ ! -d './jwt_certs' ]; then
	#create and switch into
	mkdir jwt_certs ;
	cd jwt_certs ;
	#generate the keys
	openssl genrsa -out private.pem 4096 ;
	openssl rsa -in private.pem -pubout -out public.pem ;
	#restore the context
	cd .. ;
fi
#cd out to root directory
cd ..;
#docker compose up
docker compose --env-file .env up --build
