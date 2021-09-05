from bs4 import BeautifulSoup
import requests
import re
import unicodedata


def slugify(value, allow_unicode=False):
    """
    Taken from https://github.com/django/django/blob/master/django/utils/text.py
    Convert to ASCII if 'allow_unicode' is False. Convert spaces or repeated
    dashes to single dashes. Remove characters that aren't alphanumerics,
    underscores, or hyphens. Convert to lowercase. Also strip leading and
    trailing whitespace, dashes, and underscores.
    """
    value = str(value)
    value = value.replace("\\", "-")
    value = value.replace("/", "-")
    if allow_unicode:
        value = unicodedata.normalize('NFKC', value)
    else:
        value = unicodedata.normalize('NFKD', value).encode('ascii', 'ignore').decode('ascii')
    value = re.sub(r'[^\w\s-]', '', value.lower())
    return re.sub(r'[-\s]+', '-', value).strip('-_')


def enumerate_tags(tag_list):
    for i in range(len(tag_list)):
        print(i, tag_list[i])


def strip(word):
    word = str(word)\
        .replace("\\t", "")\
        .replace("\\n", "")\
        .replace("\'", "") \
        .replace("\"", "") \
        .replace("[", "").\
        replace("]", "").replace("\\xa0", " ")
    while word and word[0] == " ":
        word = word[1:]
    while word and word[-1] == " ":
        word = word[:-1]
    #word = " ".join(word.split())
    return word


def process_url(url):
    headers = {'user-agent': 'bisonwatch-vis_project_2021'}

    r = requests.get(url, headers=headers)

    delimiter = " :3 S: "

    soup = BeautifulSoup(r.text, 'html.parser')
    tags = soup.find_all(re.compile("td"))

    filename = strip(tags[4].contents[0])
    course_title = str(soup.find("h1").contents)\
        .removesuffix(" - Einzelansicht\\n        ']")\
        .removeprefix("['\\n\\t\\t\\t\\t\\t\\t\\t\\t\\t\\t        \\t")

    if len(filename) < 2:
        filename = "NoNumber - " + slugify(strip(course_title))
    else:
        filename = slugify(filename)


    f = open("database/" + filename + '.txt', 'w')
    f.write("Veranstaltungstitel" + delimiter + course_title + "\n")
    f.write("Bisonlink" + delimiter + url + "\n")
    f.write('# Grunddaten' + delimiter + "\n")
    f.write('Veranstaltungsart' + delimiter + strip(tags[2].contents) + "\n")
    if len(strip(tags[3].contents)) == 0:
        f.write('SWS' + delimiter + "missing" + "\n")
    else:
        f.write('SWS' + delimiter + strip(tags[3].contents) + "\n")
    f.write('Veranstaltungsnummer' + delimiter + strip(tags[4].contents) + "\n")
    f.write('Max. Teilnehmer/-innen' + delimiter + strip(tags[5].contents) + "\n")
    f.write('Semester' + delimiter + strip(tags[6].contents) + "\n")
    f.write('Zugeordnetes Modul' + delimiter + strip(tags[7].contents) + "\n")
    f.write('Erwartete Teilnehmer/-innen' + delimiter + strip(tags[8].contents) + "\n")
    f.write('Rhythmus' + delimiter + strip(tags[9].contents) + "\n")
    hyperlink = ""
    try:
        hyperlink = tags[10].find("a")["href"]
    except:
        hyperlink = "missing"
    f.write('Hyperlink' + delimiter + hyperlink + "\n")
    try:
        language = soup.find(attrs={"headers": "basic_13"}).contents
    except Exception:
        print("Hinweis: Keine Sprache für " + filename)
        language = "missing"
    f.write('Sprache' + delimiter + strip(language) + "\n")
    # Fakultät
    faculty = ""
    try:
        faculty = strip(soup.find(attrs={"style": "padding-left: 10px;"}).find("a").contents[0])
    except Exception:
        try:
            faculty = strip(soup.find(attrs={"summary": "Übersicht über die zugehörigen Einrichtungen"}).find("a").contents[-1])
            if faculty not in ["Bauhaus-Universität Weimar", "Fakultät Bauingenieurwesen", "Fakultät Architektur und Urbanistik", "Fakultät Medien", "Fakultät Kunst und Gestaltung"]:
                faculty = "missing"
        except Exception:
            faculty = "missing"
    f.write('Fakultät' + delimiter + faculty + "\n")
    # Zeit
    try:
        tags = soup.find(attrs={"summary": "Übersicht über alle Veranstaltungstermine"}).find_all("td")
    except Exception:
        #print("Hinweis: Keine Veranstaltungstermine für " + filename)
        tags = []
    if tags:
        for i in range(int((len(tags))/11)):
            f.write('# Zeit' + "\n")
            day = strip(tags[i*11 + 1].contents)
            if len(day) < 1 or day not in ["Mo.", "Di.", "Mi.", "Do.", "Fr.", "Sa.", "So."]:
                f.write('Tag' + delimiter + "missing" + "\n")
            else:
                f.write('Tag' + delimiter + day + "\n")
            f.write('Zeit' + delimiter + strip(tags[i*11 + 2].contents).replace("\\xa0bis\\xa0", " - ") + "\n")

            f.write('Terminrhythmus' + delimiter + strip(tags[i*11 + 3].contents) + "\n")
            f.write('Bemerkung' + delimiter + strip(tags[i*11 + 8].contents) + "\n")
    try:
        tags = soup.find(attrs={"summary": "Verantwortliche Dozenten"}).find_all("td")
    except Exception:
        #print("Hinweis: Keine Dozenten für " + filename)
        tags = []
    f.write('# Personen' + "\n")
    if tags:
        f.write('Personen')
        for i in range(int((len(tags)/2))):
            person_entry = strip(tags[i*2].find("a").contents).split(",")
            # Teste ob Vor- und Nachname gegeben sind
            if len(person_entry) > 1:
                f.write(delimiter + strip(person_entry[1]).split(" ")[0] + " " + strip(person_entry[0]))
            else:
                f.write(delimiter + strip(person_entry[0]))
        f.write("\n")
    f.write("# Beschreibung" +"\n")
    try:
        tags = soup.find(attrs={"summary": "Weitere Angaben zur Veranstaltung"}).find_all("td")
    except Exception:
        #print("Hinweis: Keine Beschreibung für " + filename)
        tags = []
    if tags and tags[0].find("p"):
        f.write('Beschreibung' + delimiter + strip(tags[0].find("p").contents) + "\n")



