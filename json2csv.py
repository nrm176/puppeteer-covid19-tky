import csv, json, sys
from collections import OrderedDict

if sys.argv[1] is not None and sys.argv[2] is not None and sys.argv[3] is not None:
    fileInput = sys.argv[1]
    file_patients = sys.argv[2]
    file_histories = sys.argv[3]

    patients_keys = {'pid', 'age_group', 'gender', 'address', 'job_pattern', 'symptom', 'date'}
    history_keys = {'pid', 'hid', 'body'}

    inputFile = open(fileInput)  # open json file
    output_patients = open(file_patients, 'w')  # load csv file
    output_histories = open(file_histories, 'w')  # load csv file
    data = json.load(inputFile)  # load json content
    inputFile.close()  # close the input file
    writer_patients = csv.writer(output_patients)  # create a csv.write
    writer_histories = csv.writer(output_histories)  # create a csv.write
    writer_patients.writerow(patients_keys)  # header row
    writer_histories.writerow(history_keys)  # header row

    patients = [OrderedDict([(key, row[key]) for key in row.keys() & patients_keys]) for row in data]
    histories = [row.get('note') for row in data]

    for patient in patients:
        writer_patients.writerow(patient.values())

    for history in histories:
        for item in history:
            writer_histories.writerow(item.values())
