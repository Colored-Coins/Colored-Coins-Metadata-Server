# ColoredCoins Metadata Server

[![Slack Channel][slack-image]][slack-url]

[![js-standard-style][js-standard-image]][js-standard-url]

REST API server for fetching and sharing ColoredCoins transactions metadata.

## Getting Started

### Installation
```
$ npm i -g cc-metadata-server
```

### Run

Currently, the server uses [AWS S3](http://docs.aws.amazon.com/AmazonS3/latest/dev/Welcome.html) storage service as a caching layer.
So, in order to use the server one needs to set the environment variables:

```
AWS_ACCESS_KEY_ID
AWS_SECRET_ACCESS_KEY
AWS_S3_BUCKET
```

Then, you can run the ColoredCoins metadata server with the following options:

```sh
$ cc-metadata-server [options]

  Options:

    -h, --help                                         output usage information
    -V, --version                                      output the version number
    -p, --port <port>                                  Port to listen on
```

Or just run it with the defaults using:

```sh
$ cc-metadata-server
```

## API

### `GET /getMetadata`

* Query Parameters:
  * `torrentHash` hex string of length 40, representing the SHA1 result of the origin metadata torrent file
  * `sha2` hex string of length 64, the SHA256 result of `JSON.stringify()` of the origin metadata

* Success Response:
    
   **Code:** 200 OK<br>
   **Content:** The origin metadata JSON

* Error Response:

   **Code:** 400 Bad Request<br>
   **Content:** `"Can't get metadata"`<br>
   In case no file which correponds to given `torrentHash` and `sha2` is found.

### `POST /addMetadata`

* Body Parameters:
  * `metadata` JSON
  * `token` JWT encoded by secret given in environment variable `JWTTOKENSECRET`. Decode is of the format `{iss: 'admin', exp: 'expiration'}`.</br>
  If `JWTTOKENSECRET` environment variable (or corresponding properties file field) is not given, this parameter is ignored.

* Success Response:

  **Code:** 200 OK<br>
  **Content:** Object which consists of the following:
    * `torrentHash` hex string of length 40, representing the SHA1 result of the origin metadata torrent file
    * `sha2` hex string of length 64, the SHA256 result of `JSON.stringify()` of the origin metadata

* Error Response:

   **Code:** 401 Unauthorized<br>
   In case given `token` is not as expected.

### `GET /shareMetadata`

*  Query parameters
   * `torrentHash` hex string of length 40, representing the SHA1 result of the origin metadata torrent file
   * `token` JWT encoded by secret given in environment variable `JWTTOKENSECRET`. Decode is of the format `{iss: 'admin', exp: 'expiration'}`.</br>
   If `JWTTOKENSECRET` environment variable (or corresponding properties file field) is not given, this parameter is ignored.

* Success Response:

  **Code:** 200 OK<br>
  **Content:** The metadata file which has torrent which corresponds to `torrentHash`, is seeded to BitTorrent network.

* Error Response:

   **Code:** 401 Unauthorized<br>
   In case given `token` is not as expected.

   **Code:** 400 Bad Request<br>
   **Content:** `"Can't share metadata"`<br>
   In case no file which corresponds to `torrentHash` is found.

**Note:** this call should be preceded by a call to `POST /addMetadata`

## Configuration

Default configuration per environment (`NODE_ENV` value) can be found in the [`config` directory](./config). 
You can use custom properties by adding `properties.conf` to that folder.

## Development

1. Fork this repo
2. npm install
3. use the Standard coding style when hacking the code - https://github.com/feross/standard
4. Send us a pull request

## Hosted Server

ColoredCoins maintains a hosted version of this server at:<br>
`https://prod-metadata.coloredcoins.org`

## License

[Apache-2.0](http://www.apache.org/licenses/LICENSE-2.0)

[js-standard-url]: https://github.com/feross/standard
[js-standard-image]: https://cdn.rawgit.com/feross/standard/master/badge.svg
[slack-image]: http://slack.coloredcoins.org/badge.svg
[slack-url]: http://slack.coloredcoins.org