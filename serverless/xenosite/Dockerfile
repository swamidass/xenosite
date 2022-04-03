ARG FUNCTION_DIR="/var/task"

FROM public.ecr.aws/apparentorder/reweb as reweb

FROM ubuntu:bionic AS builder
ARG FUNCTION_DIR

RUN apt-get update -y && apt-get install gcc curl python-dev libpcre3 libpcre3-dev autoconf -y

RUN apt-get install python python-dev -y
RUN curl https://bootstrap.pypa.io/pip/2.7/get-pip.py --output get-pip.py && python2.7 get-pip.py

RUN  pip2 install uwsgi flask flask_compress --target ${FUNCTION_DIR}

FROM registry.fly.io/xenosite:base
ARG FUNCTION_DIR

COPY --from=builder  ${FUNCTION_DIR}  ${FUNCTION_DIR}
COPY --from=reweb /reweb /reweb

ADD ./* ${FUNCTION_DIR}

ENV REWEB_APPLICATION_EXEC /var/task/bin/uwsgi --ini uwsgi.ini 
ENV REWEB_APPLICATION_PORT 5000
ENV REWEB_DEBUG 1

WORKDIR ${FUNCTION_DIR}

ENTRYPOINT ["/reweb"]
