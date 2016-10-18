SETTINGS = project.settings

run:
	python manage.py runserver 0.0.0.0:8000

shell:
	python manage.py shell

superuser:
	./manage.py createsuperuser --username=admin --email=admin@example.com

mailserver:
	python -m smtpd -n -c DebuggingServer 0.0.0.0:1025

collect:
	python manage.py collectstatic --noinput

manage:
	python manage.py $(CMD)

graphviz:
	python manage.py graph_models -a -o logic_models.png -e -g

pull:
	git pull origin master && ./manage.py collectstatic --noinput

install:
	pip install -r requirements.txt
	npm install
	bower install install

