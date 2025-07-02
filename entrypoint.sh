#/bin/bash
# "MAIN_URLS": "",
# "onedrive_uid": "",
# "onedrive_key": "",
# "alicloud_uid": "",
# "alicloud_key": "",
# "baiduyun_uid": "",
# "baiduyun_key": "",
# "baiduyun_ext": "",
# "cloud115_uid": "",
# "cloud115_key": "",
# "googleui_uid": "",
# "googleui_key": "",
# "yandexui_uid": "",
# "yandexui_key": "",
# "dropboxs_uid": "",
# "dropboxs_key": "",
# "quarkpan_uid": "",
# "quarkpan_key": "",

#替换目录下wrangler文件中的MAIN_URLS
if [ -z "${OPLIST_MAIN_URLS}" ]; then
    echo "MAIN_URLS is not set, skipping replacement."
else
    echo "Replacing MAIN_URLS in wrangler file..."
    sed -i "s|\"MAIN_URLS\":.*|\"MAIN_URLS\": \"${OPLIST_MAIN_URLS}\",|" ./wrangler.jsonc
fi
#替换目录下wrangler文件中的onedrive_uid
if [ -z "${OPLIST_ONEDRIVE_UID}" ]; then
    echo "ONEDRIVE_UID is not set, skipping replacement."
else
    echo "Replacing onedrive_uid in wrangler file..."
    sed -i "s|\"onedrive_uid\":.*|\"onedrive_uid\": \"${OPLIST_ONEDRIVE_UID}\",|" ./wrangler.jsonc
fi
#替换目录下wrangler文件中的onedrive_key
if [ -z "${OPLIST_ONEDRIVE_KEY}" ]; then
    echo "ONEDRIVE_KEY is not set, skipping replacement."
else
    echo "Replacing onedrive_key in wrangler file..."
    sed -i "s|\"onedrive_key\":.*|\"onedrive_key\": \"${OPLIST_ONEDRIVE_KEY}\",|" ./wrangler.jsonc
fi
#替换目录下wrangler文件中的alicloud_uid
if [ -z "${OPLIST_ALICLOUD_UID}" ]; then
    echo "ALICLOUD_UID is not set, skipping replacement."
else
    echo "Replacing alicloud_uid in wrangler file..."
    sed -i "s|\"alicloud_uid\":.*|\"alicloud_uid\": \"${OPLIST_ALICLOUD_UID}\",|" ./wrangler.jsonc
fi
#替换目录下wrangler文件中的alicloud_key
if [ -z "${OPLIST_ALICLOUD_KEY}" ]; then
    echo "ALICLOUD_KEY is not set, skipping replacement."
else
    echo "Replacing alicloud_key in wrangler file..."
    sed -i "s|\"alicloud_key\":.*|\"alicloud_key\": \"${OPLIST_ALICLOUD_KEY}\",|" ./wrangler.jsonc
fi
#替换目录下wrangler文件中的baiduyun_uid
if [ -z "${OPLIST_BAIDUYUN_UID}" ]; then
    echo "BAIDUYUN_UID is not set, skipping replacement."
else
    echo "Replacing baiduyun_uid in wrangler file..."
    sed -i "s|\"baiduyun_uid\":.*|\"baiduyun_uid\": \"${OPLIST_BAIDUYUN_UID}\",|" ./wrangler.jsonc
fi
#替换目录下wrangler文件中的baiduyun_key
if [ -z "${OPLIST_BAIDUYUN_KEY}" ]; then
    echo "BAIDUYUN_KEY is not set, skipping replacement."
else
    echo "Replacing baiduyun_key in wrangler file..."
    sed -i "s|\"baiduyun_key\":.*|\"baiduyun_key\": \"${OPLIST_BAIDUYUN_KEY}\",|" ./wrangler.jsonc
fi
#替换目录下wrangler文件中的baiduyun_ext
if [ -z "${OPLIST_BAIDUYUN_EXT}" ]; then
    echo "BAIDUYUN_EXT is not set, skipping replacement."
else
    echo "Replacing baiduyun_ext in wrangler file..."
    sed -i "s|\"baiduyun_ext\":.*|\"baiduyun_ext\": \"${OPLIST_BAIDUYUN_EXT}\",|" ./wrangler.jsonc
fi
#替换目录下wrangler文件中的cloud115_uid
if [ -z "${OPLIST_CLOUD115_UID}" ]; then
    echo "cloud115_uid is not set, skipping replacement."
else
    echo "Replacing cloud115_uid in wrangler file..."
    sed -i "s|\"cloud115_uid\":.*|\"cloud115_uid\": \"${OPLIST_CLOUD115_UID}\",|" ./wrangler.jsonc
fi
#替换目录下wrangler文件中的115cloud_key
if [ -z "${OPLIST_CLOUD115_KEY}" ]; then
    echo "CLOUD_KEY115 is not set, skipping replacement."
else
    echo "Replacing 115cloud_key in wrangler file..."
    sed -i "s|\"cloud115_key\":.*|\"cloud115_key\": \"${OPLIST_CLOUD115_KEY}\",|" ./wrangler.jsonc
fi
#替换目录下wrangler文件中的googleui_uid
if [ -z "${OPLIST_GOOGLEUI_UID}" ]; then
    echo "GOOGLEUI_UID is not set, skipping replacement."
else
    echo "Replacing googleui_uid in wrangler file..."
    sed -i "s|\"googleui_uid\":.*|\"googleui_uid\": \"${OPLIST_GOOGLEUI_UID}\",|" ./wrangler.jsonc
fi
#替换目录下wrangler文件中的googleui_key
if [ -z "${OPLIST_GOOGLEUI_KEY}" ]; then
    echo "GOOGLEUI_KEY is not set, skipping replacement."
else
    echo "Replacing googleui_key in wrangler file..."
    sed -i "s|\"googleui_key\":.*|\"googleui_key\": \"${OPLIST_GOOGLEUI_KEY}\",|" ./wrangler.jsonc
fi
# 替换目录下wrangler文件中的yandexui_uid
if [ -z "${OPLIST_YANDEXUI_UID}" ]; then
    echo "YANDEXUI_UID is not set, skipping replacement."
else
    echo "Replacing yandexui_uid in wrangler file..."
    sed -i "s|\"yandexui_uid\":.*|\"yandexui_uid\": \"${OPLIST_YANDEXUI_UID}\",|" ./wrangler.jsonc
fi
# 替换目录下wrangler文件中的yandexui_key
if [ -z "${OPLIST_YANDEXUI_KEY}" ]; then
    echo "YANDEXUI_KEY is not set, skipping replacement."
else
    echo "Replacing yandexui_key in wrangler file..."
    sed -i "s|\"yandexui_key\":.*|\"yandexui_key\": \"${OPLIST_YANDEXUI_KEY}\",|" ./wrangler.jsonc
fi
# 替换目录下wrangler文件中的dropboxs_uid
if [ -z "${OPLIST_DROPBOXS_UID}" ]; then
    echo "DROPBOXS_UID is not set, skipping replacement."
else
    echo "Replacing dropboxs_uid in wrangler file..."
    sed -i "s|\"dropboxs_uid\":.*|\"dropboxs_uid\": \"${OPLIST_DROPBOXS_UID}\",|" ./wrangler.jsonc
fi
# 替换目录下wrangler文件中的dropboxs_key
if [ -z "${OPLIST_DROPBOXS_KEY}" ]; then
    echo "DROPBOXS_KEY is not set, skipping replacement."
else
    echo "Replacing dropboxs_key in wrangler file..."
    sed -i "s|\"dropboxs_key\":.*|\"dropboxs_key\": \"${OPLIST_DROPBOXS_KEY}\",|" ./wrangler.jsonc
fi
# 替换目录下wrangler文件中的quarkpan_uid
if [ -z "${OPLIST_QUARKPAN_UID}" ]; then
    echo "QUARKPAN_UID is not set, skipping replacement."
else
    echo "Replacing quarkpan_uid in wrangler file..."
    sed -i "s|\"quarkpan_uid\":.*|\"quarkpan_uid\": \"${OPLIST_QUARKPAN_UID}\",|" ./wrangler.jsonc
fi
# 替换目录下wrangler文件中的quarkpan_key
if [ -z "${OPLIST_QUARKPAN_KEY}" ]; then
    echo "QUARKPAN_KEY is not set, skipping replacement."
else
    echo "Replacing quarkpan_key in wrangler file..."
    sed -i "s|\"quarkpan_key\":.*|\"quarkpan_key\": \"${OPLIST_QUARKPAN_KEY}\",|" ./wrangler.jsonc
fi


echo "Modified wrangler.jsonc file:"
cat ./wrangler.jsonc
# 执行npm run dev
echo "Starting wrangler dev..."
wrangler dev --ip 0.0.0.0 --port 3000 -c wrangler.jsonc
if [ $? -ne 0 ]; then
    echo "wrangler dev failed, exiting."
    exit 1
fi
