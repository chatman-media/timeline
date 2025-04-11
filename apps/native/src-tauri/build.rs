fn main() {
    tauri_build::build();
    println!("cargo:rustc-check-cfg=cfg(mobile)");
} 