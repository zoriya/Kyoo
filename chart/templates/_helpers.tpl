{{/*
Create kyoo ingress name
*/}}
{{- define "kyoo.ingress.fullname" -}}
{{- printf "%s-%s" (include "kyoo.fullname" .) "ingress" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create kyoo api name
*/}}
{{- define "kyoo.api.fullname" -}}
{{- printf "%s-%s" (include "kyoo.fullname" .) .Values.api.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the api service account to use
*/}}
{{- define "kyoo.api.serviceAccountName" -}}
{{- if .Values.api.serviceAccount.create -}}
    {{ default (include "kyoo.api.fullname" .) .Values.api.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.api.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create kyoo api-metadata name
*/}}
{{- define "kyoo.apiimagedata.fullname" -}}
{{- printf "%s-%s%s" (include "kyoo.fullname" .) .Values.api.name "metadata" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create kyoo auth name
*/}}
{{- define "kyoo.auth.fullname" -}}
{{- printf "%s-%s" (include "kyoo.fullname" .) .Values.auth.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the auth service account to use
*/}}
{{- define "kyoo.auth.serviceAccountName" -}}
{{- if .Values.auth.serviceAccount.create -}}
    {{ default (include "kyoo.auth.fullname" .) .Values.auth.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.auth.serviceAccount.name }}
{{- end -}}
{{- end -}}


{{/*
Create kyoo front name
*/}}
{{- define "kyoo.front.fullname" -}}
{{- printf "%s-%s" (include "kyoo.fullname" .) .Values.front.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the front service account to use
*/}}
{{- define "kyoo.front.serviceAccountName" -}}
{{- if .Values.front.serviceAccount.create -}}
    {{ default (include "kyoo.front.fullname" .) .Values.front.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.front.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create kyoo scanner name
*/}}
{{- define "kyoo.scanner.fullname" -}}
{{- printf "%s-%s" (include "kyoo.fullname" .) .Values.scanner.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the scanner service account to use
*/}}
{{- define "kyoo.scanner.serviceAccountName" -}}
{{- if .Values.scanner.serviceAccount.create -}}
    {{ default (include "kyoo.scanner.fullname" .) .Values.scanner.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.scanner.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create kyoo transcoder name
*/}}
{{- define "kyoo.transcoder.fullname" -}}
{{- printf "%s-%s" (include "kyoo.fullname" .) .Values.transcoder.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the transcoder service account to use
*/}}
{{- define "kyoo.transcoder.serviceAccountName" -}}
{{- if .Values.transcoder.serviceAccount.create -}}
    {{ default (include "kyoo.transcoder.fullname" .) .Values.transcoder.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.transcoder.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create kyoo transcoder-metadata name
*/}}
{{- define "kyoo.transcodermetadata.fullname" -}}
{{- printf "%s-%s%s" (include "kyoo.fullname" .) .Values.transcoder.name "metadata" | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create kyoo traefikproxy name
*/}}
{{- define "kyoo.traefikproxy.fullname" -}}
{{- printf "%s-%s" (include "kyoo.fullname" .) .Values.traefikproxy.name | trunc 63 | trimSuffix "-" -}}
{{- end -}}

{{/*
Create the name of the traefikproxy service account to use
*/}}
{{- define "kyoo.traefikproxy.serviceAccountName" -}}
{{- if .Values.traefikproxy.serviceAccount.create -}}
    {{ default (include "kyoo.traefikproxy.fullname" .) .Values.traefikproxy.serviceAccount.name }}
{{- else -}}
    {{ default "default" .Values.traefikproxy.serviceAccount.name }}
{{- end -}}
{{- end -}}

{{/*
Create kyoo middlewareproxy rootURL
rootURL does not include 
*/}}
{{- define "kyoo.middlewareRootURL" -}}
    {{ default (printf "http://%s" (include "kyoo.traefikproxy.fullname" .)) .Values.kyoo.middlewareRootURL }}
{{- end -}}