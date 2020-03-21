### How to get started

After cloning repositiory, simply start off by
> npm install

and then
> node run.js

This will fetch patients information and activity prior to positive diagnosis and create data.json.

You may want to convert a json file to csv.  Here I created two types of files - patient and history 
> python json2csv.py data.json patients.csv histories.csv
