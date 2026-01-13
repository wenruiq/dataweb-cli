import { $ } from 'bun';

const platforms = ['darwin-arm64', 'darwin-x64']; // Start with macOS only

async function build() {
  console.log('Building dataweb-cli...\n');

  // Create dist directory
  await $`mkdir -p dist`;

  // Build compiled binary for each platform
  for (const platform of platforms) {
    console.log(`Building for ${platform}...`);

    const [os, arch] = platform.split('-');
    const outputName = `dataweb-cli-${platform}`;

    try {
      await $`bun build --compile --minify --sourcemap --target=bun-${os}-${arch} src/cli.ts --outfile dist/${outputName}`;
      console.log(`✓ Built dist/${outputName}\n`);
    } catch (error) {
      console.error(`✗ Failed to build for ${platform}:`, error);
      process.exit(1);
    }
  }

  console.log('Build complete!');
}

build();
