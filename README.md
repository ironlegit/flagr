<p align="center">
  <img src="assets/flagr.svg" alt="flagr" width="150">
</p>

<p align="center">
  <a href="https://github.com/ironlegit/flagr/tags"><img alt="Version" src="https://img.shields.io/github/v/tag/ironlegit/flagr"></a>
  <a href="https://sonarcloud.io/dashboard?id=ironlegit_flagr"><img alt="Quality Gate Status" src="https://sonarcloud.io/api/project_badges/measure?project=ironlegit_flagr&metric=alert_status"></a>
  <a href="https://sonarcloud.io/dashboard?id=ironlegit_flagr"><img alt="Maintainability Rating" src="https://sonarcloud.io/api/project_badges/measure?project=ironlegit_flagr&metric=sqale_rating"></a>
  <a href="https://sonarcloud.io/dashboard?id=ironlegit_flagr"><img alt="Security Rating" src="https://sonarcloud.io/api/project_badges/measure?project=ironlegit_flagr&metric=security_rating"></a>
  <a href="https://sonarcloud.io/dashboard?id=ironlegit_flagr"><img alt="Bugs" src="https://sonarcloud.io/api/project_badges/measure?project=ironlegit_flagr&metric=bugs"></a>
</p>

## Overview

This is a simple web app that identifies flags based on keywords and patterns. It fetches country data from the [REST Countries API](https://restcountries.com/).

Then again, you could just try to memorize the flags.

---

## Features

- **Search by Description**: Filter flags using keywords from their flag description.
- **Search by Patterns**: Filter flags using predefined pattern buttons.
- **Alphabetical Sorting**: Flags are sorted and grouped by the first letter of the country name.
- **Toggle Names**: Show or hide country names below the flags.
- **Toggle Mode**: Switch between "Overview Mode" (compact view) and "Detail Mode" (expanded view).

---

## Usage

Test the [Flagr web app here](flagger.ironlegit.com) or run it locally.

### Prerequisites

- Docker and Docker Compose installed.
- A [REST Countries API key](https://restcountries.com/).

### Setup

1. **API Key**: Add REST Countries API key in `.env`
2. **Run the App**: Start the development server with `docker-compose up`
3. **Access the App**: Open your browser and open [localhost:8080](http://localhost:8080)
